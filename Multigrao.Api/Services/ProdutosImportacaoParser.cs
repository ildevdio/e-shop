using System.Globalization;

namespace Multigrao.Api.Services
{
    public class LinhaImportacaoProduto
    {
        public string CodigoErp { get; set; } = string.Empty;
        public string? Nome { get; set; }
        public string? UnidadeVenda { get; set; }
        public decimal PesoUnidade { get; set; }
        public bool Ativo { get; set; }
        public decimal UnidadesPorCaixa { get; set; }
        public decimal PrecoVarejo { get; set; }
        public decimal PrecoAtacado { get; set; }
        public decimal EstoqueFiscalSefaz { get; set; }
        public decimal ValorFrete { get; set; }
    }

    public static class ProdutosImportacaoParser
    {
        private static readonly string[] ColunasPadrao =
        {
            "id", "codigo_erp", "nome", "unidade_venda", "peso_unidade", "ativo",
            "unidades_por_caixa", "preco_varejo", "preco_atacado", "estoque_fiscal_sefaz", "data_carga"
        };

        public static List<LinhaImportacaoProduto> Parse(string sql)
        {
            var linhas = new List<LinhaImportacaoProduto>();
            int idx = 0;
            while (true)
            {
                int insert = sql.IndexOf("insert into", idx, StringComparison.OrdinalIgnoreCase);
                if (insert < 0) break;

                int pos = SkipWhitespace(sql, insert + "insert into".Length);
                string tabela = LerIdentificador(sql, ref pos);
                var partes = tabela.Split('.');
                var nomeTabela = partes[^1].Trim('"');

                if (!string.Equals(nomeTabela, "tb_produtos_crm", StringComparison.OrdinalIgnoreCase))
                {
                    idx = insert + 1;
                    continue;
                }

                string[]? colunas = null;
                pos = SkipWhitespace(sql, pos);
                if (pos < sql.Length && sql[pos] == '(')
                {
                    string grupo = LerGrupo(sql, ref pos);
                    colunas = SplitNivel(grupo, ',')
                        .Select(c => c.Trim().Trim('"'))
                        .Where(c => c.Length > 0)
                        .ToArray();
                }

                pos = SkipWhitespace(sql, pos);
                int values = sql.IndexOf("values", pos, StringComparison.OrdinalIgnoreCase);
                if (values < 0) break;
                pos = SkipWhitespace(sql, values + "values".Length);

                while (pos < sql.Length && sql[pos] == '(')
                {
                    string grupo = LerGrupo(sql, ref pos);
                    var valores = SplitNivel(grupo, ',');
                    var linha = MontarLinha(colunas, valores);
                    if (linha != null) linhas.Add(linha);

                    pos = SkipWhitespace(sql, pos);
                    if (pos < sql.Length && sql[pos] == ',')
                        pos = SkipWhitespace(sql, pos + 1);
                    else
                        break;
                }

                idx = pos;
            }
            return linhas;
        }

        private static int SkipWhitespace(string s, int i)
        {
            while (i < s.Length && char.IsWhiteSpace(s[i])) i++;
            return i;
        }

        private static string LerIdentificador(string s, ref int i)
        {
            int inicio = i;
            while (i < s.Length && !char.IsWhiteSpace(s[i]) && s[i] != '(' && s[i] != ')')
                i++;
            return s[inicio..i];
        }

        private static string LerGrupo(string s, ref int i)
        {
            int inicio = i;
            int profundidade = 0;
            bool emString = false;
            while (i < s.Length)
            {
                char c = s[i];
                if (emString)
                {
                    if (c == '\'')
                    {
                        if (i + 1 < s.Length && s[i + 1] == '\'') { i += 2; continue; }
                        emString = false;
                    }
                }
                else if (c == '\'') emString = true;
                else if (c == '(') profundidade++;
                else if (c == ')')
                {
                    profundidade--;
                    if (profundidade == 0)
                    {
                        int fim = i;
                        i++;
                        return s[(inicio + 1)..fim];
                    }
                }
                i++;
            }
            return s[(inicio + 1)..];
        }

        private static List<string> SplitNivel(string texto, char separador)
        {
            var partes = new List<string>();
            int inicio = 0, profundidade = 0;
            bool emString = false;
            for (int i = 0; i < texto.Length; i++)
            {
                char c = texto[i];
                if (emString)
                {
                    if (c == '\'')
                    {
                        if (i + 1 < texto.Length && texto[i + 1] == '\'') { i++; continue; }
                        emString = false;
                    }
                }
                else if (c == '\'') emString = true;
                else if (c == '(') profundidade++;
                else if (c == ')') profundidade--;
                else if (c == separador && profundidade == 0)
                {
                    partes.Add(texto[inicio..i]);
                    inicio = i + 1;
                }
            }
            partes.Add(texto[inicio..]);
            return partes;
        }

        private static LinhaImportacaoProduto? MontarLinha(string[]? colunas, List<string> valores)
        {
            var linha = new LinhaImportacaoProduto();
            int n = Math.Min(colunas?.Length ?? valores.Count, valores.Count);
            bool temColunas = colunas != null && colunas.Length > 0;
            for (int i = 0; i < n; i++)
            {
                string nomeCol = temColunas
                    ? colunas![i].ToLowerInvariant()
                    : ColunasPadrao[Math.Min(i, ColunasPadrao.Length - 1)];

                var raw = valores[i].Trim();
                switch (nomeCol)
                {
                    case "codigo_erp":
                        linha.CodigoErp = ConverterTexto(raw) ?? "";
                        break;
                    case "nome":
                        linha.Nome = ConverterTexto(raw);
                        break;
                    case "unidade_venda":
                        linha.UnidadeVenda = ConverterTexto(raw);
                        break;
                    case "peso_unidade":
                        linha.PesoUnidade = ConverterDecimal(raw);
                        break;
                    case "ativo":
                        linha.Ativo = ConverterBool(raw);
                        break;
                    case "unidades_por_caixa":
                        linha.UnidadesPorCaixa = ConverterDecimal(raw);
                        break;
                    case "preco_varejo":
                        linha.PrecoVarejo = ConverterDecimal(raw);
                        break;
                    case "preco_atacado":
                        linha.PrecoAtacado = ConverterDecimal(raw);
                        break;
                    case "estoque_fiscal_sefaz":
                        linha.EstoqueFiscalSefaz = ConverterDecimal(raw);
                        break;
                    case "valor_frete":
                        linha.ValorFrete = ConverterDecimal(raw);
                        break;
                }
            }
            return linha;
        }

        private static string? ConverterTexto(string raw)
        {
            if (raw.Length == 0) return null;
            if (raw.Equals("NULL", StringComparison.OrdinalIgnoreCase) || raw.Equals("DEFAULT", StringComparison.OrdinalIgnoreCase))
                return null;
            if (raw[0] == '\'')
            {
                var s = raw.Length >= 2 && raw[^1] == '\'' ? raw[1..^1] : raw[1..];
                return s.Replace("''", "'");
            }
            return raw;
        }

        private static decimal ConverterDecimal(string raw)
        {
            if (raw.Length == 0) return 0;
            if (raw[0] == '\'') raw = ConverterTexto(raw) ?? "0";
            if (raw.Equals("NULL", StringComparison.OrdinalIgnoreCase) || raw.Equals("DEFAULT", StringComparison.OrdinalIgnoreCase))
                return 0;
            var normalizado = raw.Replace(',', '.');
            return decimal.TryParse(normalizado, NumberStyles.Number, CultureInfo.InvariantCulture, out var dec) ? dec : 0;
        }

        private static bool ConverterBool(string raw)
        {
            if (raw.Length == 0) return false;
            if (raw[0] == '\'') raw = ConverterTexto(raw) ?? "";
            if (raw.Equals("true", StringComparison.OrdinalIgnoreCase) || raw == "t" || raw == "1")
                return true;
            return false;
        }
    }
}
