-- ============================================================
-- GERADOR DO ARQUIVO DE IMPORTAÇÃO DE PRODUTOS (ERP -> CRM)
-- ------------------------------------------------------------
-- 1) Ajuste o caminho de saída na linha "\set saida" abaixo,
--    se precisar salvar em outro lugar.
-- 2) Rode no banco ADMIN (ERP) com:
--       psql -U postgres -d admin -h localhost -f gerar_importacao.sql
--    (senha padrão: masterkey)
-- 3) O arquivo gerado é o ".sql" para o importador do CRM:
--       Catálogo -> Gerenciar -> Produtos -> Importar ERP
-- ============================================================

\set saida 'C:/Users/geral/Desktop/Projetos/CLIENTES/Multigranno/produtos_importar.sql'
\set batch 200

\encoding UTF8
\pset format unaligned
\pset tuples_only on
\pset pager off

\o :saida
SELECT
    E'-- ============================================================\n'
    || E'-- DUMP DE PRODUTOS GERADO AUTOMATICAMENTE PARA IMPORTAÇÃO NO CRM\n'
    || E'-- Como usar: Catálogo -> Gerenciar -> Produtos -> Importar ERP\n'
    || E'-- Gerado em: ' || to_char(now(), 'DD/MM/YYYY HH24:MI:SS') || E'\n'
    || E'-- Colunas: codigo_erp, nome, unidade_venda, peso_unidade, ativo,\n'
    || E'--          unidades_por_caixa, preco_varejo, preco_atacado, estoque_fiscal_sefaz\n'
    || E'-- ============================================================\n'
    || COALESCE(
        (
            SELECT string_agg(b.ins, E'\n\n' ORDER BY b.grp)
            FROM (
                SELECT
                    grp,
                    'INSERT INTO tb_produtos_crm (codigo_erp, nome, unidade_venda, peso_unidade, ativo, unidades_por_caixa, preco_varejo, preco_atacado, estoque_fiscal_sefaz) VALUES'
                    || E'\n'
                    || string_agg(
                           format(
                               '    (%L, %L, %L, %s, %s, %s, %s, %s, %s)',
                               codigo_principal,
                               COALESCE(nome_reduzido, nome),
                               BTRIM(uni_med),
                               COALESCE(peso_liquido, 0),
                               ativo,
                               COALESCE(quant_caixa, 0),
                               preco_varejo,
                               preco_atacado,
                               estoque_fiscal_sefaz
                           ),
                           E',\n' ORDER BY rn
                       )
                    || E'\n;' AS ins
                FROM (
                    SELECT
                        ROW_NUMBER() OVER (ORDER BY p.codigo_principal) AS rn,
                        (ROW_NUMBER() OVER (ORDER BY p.codigo_principal) - 1) / :batch AS grp,
                        p.codigo_principal,
                        p.nome_reduzido,
                        p.nome,
                        p.uni_med,
                        p.peso_liquido,
                        CASE WHEN LOWER(COALESCE(p.ativo::text, '')) IN ('s','t','true','1')
                             THEN 'true' ELSE 'false' END AS ativo,
                        p.quant_caixa,
                        COALESCE(tp_varejo.preco, 0) AS preco_varejo,
                        COALESCE(tp_atacado.preco, 0) AS preco_atacado,
                        COALESCE(p.estoque_sef, 0) + COALESCE(p.estoque_sef2, 0) AS estoque_fiscal_sefaz
                    FROM cad_prod p
                    LEFT JOIN cad_tabela_preco_produto tp_varejo
                        ON p.id = tp_varejo.id_prod AND tp_varejo.id_tabela = 1
                    LEFT JOIN cad_tabela_preco_produto tp_atacado
                        ON p.id = tp_atacado.id_prod AND tp_atacado.id_tabela = 2
                    WHERE LOWER(COALESCE(p.eliminado::text, '')) NOT IN ('s','t','true','1')
                ) produtos
                GROUP BY grp
            ) b
        ),
        ''
    )
    || E'\n';
\o
