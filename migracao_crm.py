# ==============================================================================
# MIGRAÇÃO ERP -> CRM
# Script que extrai dados do ERP e gera um arquivo .sql no formato
# de inserção em bloco (batch INSERTs).
# Uso: python migracao_crm.py
# ==============================================================================

from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

# ------------------------------------------------------------------------------
# CONFIGURAÇÕES
# ------------------------------------------------------------------------------

DB_CONFIG = {
    "host": "localhost",
    "database": "efadmin",
    "user": "postgres",
    "password": "masterkey"
}

MAPEAMENTO = {
    "cad_prod": {
        "codigo_principal": "codigo_erp",
        "nome": "nome",
        "uni_med": "unidade_venda",
        "peso_liquido": "peso_unidade",
        "ativo": "ativo",
        "quant_caixa": "unidades_por_caixa",
        "produto_pesavel": "a_granel"
    }
}

TABELA_DESTINO = "tb_produtos_crm"
ARQUIVO_SAIDA = "produtos_mapeados_crm.sql"


# ------------------------------------------------------------------------------
# FUNÇÕES AUXILIARES
# ------------------------------------------------------------------------------

def verificar_colunas(cursor):
    colunas_erp = []
    colunas_crm = []

    print("🔍 Verificando estrutura do banco...")

    for tabela, colunas in MAPEAMENTO.items():
        for col_erp, col_crm in colunas.items():
            query = """
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = %s AND column_name = %s;
            """
            cursor.execute(query, (tabela, col_erp))
            col_info = cursor.fetchone()

            if col_info:
                colunas_erp.append(col_info['column_name'])
                colunas_crm.append(col_crm)
                print(f"   ✅ {tabela}.{col_info['column_name']} ({col_info['data_type']}) -> {col_crm}")
            else:
                print(f"   ❌ {tabela}.{col_erp} -> não encontrado")

    return colunas_erp, colunas_crm


def format_sql(val):
    """Converte um valor Python para o formato literal de SQL."""
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "true" if val else "false"
    if isinstance(val, (int, float, Decimal)):
        return str(val)
    val_escaped = str(val).replace("'", "''")
    return f"'{val_escaped}'"


def format_estoque(val):
    """
    Formata o estoque sem casas decimais desnecessárias: se o valor do ERP
    é um número inteiro (ex.: 90.000), sai como 90; se for realmente
    fracionário (ex.: 27.818), mantém as casas decimais significativas.
    """
    if val is None:
        return "NULL"
    texto = format(val, "f")  # notação fixa, evita notação científica
    if "." in texto:
        texto = texto.rstrip("0").rstrip(".")
    return texto if texto != "" else "0"


def escolher_filtro():
    """Pergunta ao usuário qual filtro de produtos aplicar na exportação."""
    print("\nEscolha o filtro de produtos a exportar:")
    print("  1 - Todos os produtos")
    print("  2 - Produtos com estoque positivo (Loja)")
    print("  3 - Produtos vendidos desde X meses atrás até hoje")

    opcao = None
    while opcao not in ("1", "2", "3"):
        opcao = input("Opção [1/2/3]: ").strip()
        if opcao not in ("1", "2", "3"):
            print("   ⚠️  Digite 1, 2 ou 3.")

    meses = None
    if opcao == "3":
        while meses is None:
            entrada = input("Quantos meses para trás? (número inteiro): ").strip()
            if entrada.isdigit() and int(entrada) > 0:
                meses = int(entrada)
            else:
                print("   ⚠️  Digite um número inteiro maior que zero.")

    return opcao, meses


# ------------------------------------------------------------------------------
# FUNÇÃO PRINCIPAL
# ------------------------------------------------------------------------------

def gerar_script_sql():
    try:
        opcao, meses = escolher_filtro()

        conn = psycopg2.connect(**DB_CONFIG)
        # NOTA: removido o set_client_encoding('LATIN1') -- o banco de origem
        # foi criado em UTF8; forçar LATIN1 aqui corrompe silenciosamente
        # nomes com acentuação (ex.: "Açúcar", "Café", "Pão").
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        colunas_erp, colunas_crm = verificar_colunas(cursor)

        if not colunas_erp:
            print("\n❌ Nenhuma coluna válida encontrada. Abortando.")
            cursor.close()
            conn.close()
            return

        # --------------------------------------------------------------------
        # Filtro adicional conforme a opção escolhida:
        #   1 - Todos os produtos (só exclui eliminados)
        #   2 - Estoque de LOJA + DEPOSITO (positivo)
        #   3 - Existe pelo menos uma venda (adm_doc_saida/adm_doc_saida_produto,
        #       eliminado='N') com data dentro dos últimos N meses
        # --------------------------------------------------------------------
        params = []
        if opcao == "1":
            filtro_extra = ""
            descricao_filtro = "Todos os produtos"
        elif opcao == "2":
            filtro_extra = "AND estoque_disp.quant > 0"
            descricao_filtro = "Apenas produtos com estoque (Loja + Depósito) > 0"
        else:  # opcao == "3"
            filtro_extra = """AND EXISTS (
                    SELECT 1
                    FROM adm_doc_saida_produto dsp
                    INNER JOIN adm_doc_saida ds ON ds.id = dsp.id_doc_saida
                    WHERE dsp.id_prod = p.id
                      AND ds.eliminado = 'N'
                      AND ds.data >= (CURRENT_DATE - (%s || ' months')::interval)
                )"""
            params.append(meses)
            descricao_filtro = f"Produtos vendidos nos últimos {meses} mês(es)"

        print(f"\n📦 Buscando dados do ERP... ({descricao_filtro})")
        # Preço de varejo/atacado vem de cad_prod_custo.venda_tab1 / venda_tab2.
        # Essa tabela guarda um preço por produto POR FILIAL, então usamos a
        # filial de menor id disponível para cada produto (LEFT JOIN LATERAL,
        # ordenado por filial ascendente).
        #
        # Estoque = soma de LOJA (id_estoque=1) + DEPOSITO (id_estoque=2),
        # que representa o que está realmente disponível para venda (exclui
        # Avaria/Reservado/Produção). Usamos LEFT JOIN LATERAL com COALESCE
        # para que produtos sem nenhum registro apareçam com estoque 0 em vez
        # de NULL (evita a confusão do CRM tratando NULL como "sem dado").
        #
        # Unidade de medida: o ERP usa ~19 códigos diferentes, mas o CRM só
        # aceita 'un', 'kg', 'gr', 'pc'. Mapeamento abaixo -- revisar com o
        # time de negócio se alguma unidade merecer tratamento diferente
        # (ex.: litros/mililitros e medidas lineares hoje caem em 'pc').
        query_dados = f"""
            SELECT
                p.codigo_principal                  AS codigo_erp,
                p.nome                              AS nome,
                CASE LOWER(p.uni_med)
                    WHEN 'un'   THEN 'un'
                    WHEN 'par'  THEN 'un'
                    WHEN 'kit'  THEN 'un'
                    WHEN 'dz'   THEN 'un'
                    WHEN 'kg'   THEN 'kg'
                    WHEN 'g'    THEN 'gr'
                    WHEN 'cx'   THEN 'pc'
                    WHEN 'fd'   THEN 'pc'
                    WHEN 'sc'   THEN 'pc'
                    WHEN 'pt'   THEN 'pc'
                    WHEN 'ct'   THEN 'pc'
                    WHEN 'l'    THEN 'pc'
                    WHEN 'ml'   THEN 'pc'
                    WHEN 'gl'   THEN 'pc'
                    WHEN 'm'    THEN 'pc'
                    WHEN 'cm'   THEN 'pc'
                    WHEN 'rl'   THEN 'pc'
                    WHEN 'tb'   THEN 'pc'
                    WHEN 'fr'   THEN 'pc'
                    ELSE 'pc'
                END                                  AS unidade_venda,
                p.peso_liquido                      AS peso_unidade,
                CASE WHEN p.ativo IN ('S', 's', '1', 'true', 'TRUE') THEN TRUE ELSE FALSE END AS ativo,
                p.quant_caixa                       AS unidades_por_caixa,
                CASE WHEN p.produto_pesavel IN ('S', 's', '1', 'true', 'TRUE')
                     THEN TRUE ELSE FALSE END        AS a_granel,
                custo.venda_tab1                    AS preco_varejo,
                custo.venda_tab2                    AS preco_atacado,
                estoque_disp.quant                  AS estoque
            FROM
                cad_prod p
            LEFT JOIN LATERAL (
                SELECT c.venda_tab1, c.venda_tab2
                FROM cad_prod_custo c
                WHERE c.id_prod = p.id
                ORDER BY c.filial ASC
                LIMIT 1
            ) custo ON TRUE
            LEFT JOIN LATERAL (
                SELECT COALESCE(SUM(e.quant), 0) AS quant
                FROM cad_prod_estoque e
                WHERE e.id_prod = p.id
                  AND e.id_estoque IN (1, 2)  -- 1=LOJA, 2=DEPOSITO
            ) estoque_disp ON TRUE
            WHERE
                CASE WHEN p.eliminado IN ('S', 's', '1', 'true', 'TRUE') THEN TRUE ELSE FALSE END = FALSE
                {filtro_extra};
        """

        cursor.execute(query_dados, params)
        produtos = cursor.fetchall()
        print(f"📋 Total de produtos encontrados: {len(produtos)}")

        cursor.close()
        conn.close()

        if not produtos:
            print("\n⚠️ Nenhum produto retornado. Nenhum arquivo foi gerado.")
            return

        print(f"\n📝 Gerando arquivo '{ARQUIVO_SAIDA}'...")
        with open(ARQUIVO_SAIDA, "w", encoding="utf-8") as f:
            # Cabeçalho do arquivo idêntico ao modelo
            f.write("-- ============================================================\n")
            f.write("-- DUMP PARA IMPORTAÇÃO DE PRODUTOS (ERP -> CRM)\n")
            f.write("-- Colunas: codigo_erp, nome, unidade_venda, peso_unidade,\n")
            f.write("--          ativo, unidades_por_caixa, preco_varejo,\n")
            f.write("--          preco_atacado, estoque_fiscal_sefaz, a_granel\n")
            f.write(f"-- Filtro aplicado: {descricao_filtro}\n")
            f.write("-- ============================================================\n\n")

            # Declaração do INSERT com a lista fixa de colunas
            f.write(f"INSERT INTO {TABELA_DESTINO} (\n")
            f.write("    codigo_erp, nome, unidade_venda, peso_unidade, ativo,\n")
            f.write("    unidades_por_caixa, preco_varejo, preco_atacado, estoque_fiscal_sefaz,\n")
            f.write("    a_granel\n")
            f.write(") VALUES\n")

            # Montagem das linhas no formato ('VALOR1', 'VALOR2', ...),
            linhas_values = []
            for p in produtos:
                linha = (
                    f"    ({format_sql(p['codigo_erp'])}, "
                    f"{format_sql(p['nome'])}, "
                    f"{format_sql(p['unidade_venda'])}, "
                    f"{format_sql(p['peso_unidade'])}, "
                    f"{format_sql(p['ativo'])}, "
                    f"{format_sql(p['unidades_por_caixa'])}, "
                    f"{format_sql(p['preco_varejo'])}, "
                    f"{format_sql(p['preco_atacado'])}, "
                    f"{format_estoque(p['estoque'])}, "
                    f"{format_sql(p['a_granel'])})"
                )
                linhas_values.append(linha)

            # Junta todas as linhas separando por vírgula e finaliza com ponto e vírgula (;)
            f.write(",\n".join(linhas_values))
            f.write(";\n")

        print(f"\n✅ Sucesso! Script salvo em: {ARQUIVO_SAIDA}")
        print(f"   Total de registros formatados: {len(produtos)}")

    except Exception as e:
        print(f"\n❌ Erro durante a execução: {e}")


if __name__ == "__main__":
    gerar_script_sql()
