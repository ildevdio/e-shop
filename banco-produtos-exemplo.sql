-- ============================================================
-- EXEMPLO DE DUMP PARA TESTE DA IMPORTAÇÃO DE PRODUTOS
-- Como usar: Catálogo -> Gerenciar -> Produtos -> Importar ERP
--
-- Colunas reconhecidas: codigo_erp, nome, unidade_venda,
-- peso_unidade, ativo, unidades_por_caixa, preco_varejo,
-- preco_atacado, estoque_fiscal_sefaz
--
-- CAS001/CHI001/AVE001 já existem no cadastro (atualizam em vez
-- de duplicar). Os demais serão criados.
-- ============================================================

INSERT INTO tb_produtos_crm (codigo_erp, nome, unidade_venda, peso_unidade, ativo, unidades_por_caixa, preco_varejo, preco_atacado, estoque_fiscal_sefaz) VALUES
    ('CAS001', 'Castanha do Pará', 'kg', 0.5, true, 12, 45.90, 42.50, 320.500),
    ('CHI001', 'Chia (1kg)', 'kg', 1, true, 24, 25.90, 23.00, 150.000),
    ('AVE001', 'Aveia em Flocos', 'kg', 0.5, true, 12, 12.90, 11.20, 85.250),
    ('AMEND001', 'Amendoim Torrado Salgado', 'kg', 0.25, true, 20, 9.90, 8.50, 60.000),
    ('TEM001', 'Tempero Baiano', 'g', 0.1, true, 30, 7.50, 6.30, 45.000),
    ('PAO001', 'Pão de Mel Recheado', 'un', 0.08, true, 40, 3.90, 3.20, 120.000);

-- INSERT sem a coluna estoque_fiscal_sefaz (usa 0)
INSERT INTO tb_produtos_crm (codigo_erp, nome, unidade_venda, peso_unidade, ativo, unidades_por_caixa, preco_varejo, preco_atacado) VALUES
    ('CAS002', 'Castanha de Caju Torrada', 'kg', 0.5, true, 12, 55.90, 52.00),
    ('MEL001', 'Mel de Abelha 500ml', 'ml', 0.5, true, 12, 24.90, 22.00);

-- Produto inativo (entra no cadastro como inativo, não aparece na loja)
INSERT INTO tb_produtos_crm (codigo_erp, nome, unidade_venda, peso_unidade, ativo, unidades_por_caixa, preco_varejo, preco_atacado, estoque_fiscal_sefaz) VALUES
    ('SUP001', 'Suplemento Descontinuado', 'un', 0.2, false, 12, 0, 0, 10.000);
