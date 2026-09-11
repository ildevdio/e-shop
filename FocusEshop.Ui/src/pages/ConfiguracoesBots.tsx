import { useState, useEffect } from 'react';
import { Bot, Plus, Search, Pencil, Trash2, X, Save, GripVertical, Flower2, Filter, Zap, Database, UserRound } from 'lucide-react';
import {
  botsService, type BotConfig,
  TRIGGER_OPCOES, REACAO_OPCOES, ACAO_OPCOES, CAMPOS_LEAD,
} from '../services/botsService';

const TRIGGER_CORES: Record<string, string> = {
  Saudacao: 'bg-emerald-100 text-emerald-700',
  Menu: 'bg-sky-100 text-sky-700',
  PalavraChave: 'bg-violet-100 text-violet-700',
  Igual: 'bg-amber-100 text-amber-700',
  Regex: 'bg-rose-100 text-rose-700',
  Qualquer: 'bg-gray-100 text-gray-700',
};

export default function ConfiguracoesBots() {
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [editando, setEditando] = useState<BotConfig | null>(null);
  const [form, setForm] = useState({
    nome: '',
    tipoTrigger: 'PalavraChave',
    valorTrigger: '',
    tipoReacao: 'Texto',
    textoResposta: '',
    acaoBot: 'Responder',
    campoLead: '',
    ordem: 1,
    ativo: true,
  });
  const [modalAberto, setModalAberto] = useState(false);
  const [deletando, setDeletando] = useState<BotConfig | null>(null);

  const carregar = async () => {
    setCarregando(true);
    const dados = await botsService.listar();
    setBots(dados.sort((a, b) => a.ordem - b.ordem || a.id - b.id));
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm({
      nome: '',
      tipoTrigger: 'PalavraChave',
      valorTrigger: '',
      tipoReacao: 'Texto',
      textoResposta: '',
      acaoBot: 'Responder',
      campoLead: '',
      ordem: bots.length + 1,
      ativo: true,
    });
    setModalAberto(true);
  };

  const abrirEdicao = (bot: BotConfig) => {
    setEditando(bot);
    setForm({
      nome: bot.nome,
      tipoTrigger: bot.tipoTrigger,
      valorTrigger: bot.valorTrigger,
      tipoReacao: bot.tipoReacao,
      textoResposta: bot.textoResposta,
      acaoBot: bot.acaoBot,
      campoLead: bot.campoLead || '',
      ordem: bot.ordem,
      ativo: bot.ativo,
    });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!form.nome.trim() || !modalAberto) return;
    const payload = {
      nome: form.nome.trim(),
      tipoTrigger: form.tipoTrigger,
      valorTrigger: form.valorTrigger,
      tipoReacao: form.tipoReacao,
      textoResposta: form.textoResposta,
      acaoBot: form.acaoBot,
      campoLead: form.acaoBot === 'SalvarLead' ? (form.campoLead || null) : null,
      ordem: form.ordem,
      ativo: form.ativo,
    };
    if (editando) {
      await botsService.atualizar(editando.id, payload);
    } else {
      await botsService.criar(payload);
    }
    setModalAberto(false);
    await carregar();
  };

  const confirmarDelete = async () => {
    if (!deletando) return;
    await botsService.excluir(deletando.id);
    setDeletando(null);
    setModalAberto(false);
    await carregar();
  };

  const label = (opcoes: { valor: string; label: string }[], valor: string) =>
    opcoes.find(o => o.valor === valor)?.label ?? valor;

  const botsFiltrados = bots.filter(b =>
    !filtro || b.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-sm shadow-black/20">
            <Bot size={24} />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Bots de Atendimento</h1>
          <p className="text-gray-500 mt-1">
            Configure respostas automáticas modulares: cada bot tem um <strong>trigger</strong>, uma <strong>reação</strong> e uma <strong>ação</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700"><Zap size={18} /></div>
          <div>
            <p className="text-sm font-bold text-gray-900">1. Trigger</p>
            <p className="text-xs text-gray-500 mt-1">Quando o bot dispara: palavra-chave, exato, regex, saudação, menu ou qualquer mensagem.</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700"><Flower2 size={18} /></div>
          <div>
            <p className="text-sm font-bold text-gray-900">2. Reação</p>
            <p className="text-xs text-gray-500 mt-1">O que o bot responde: texto, menu, preço, estoque ou status de pedido.</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-violet-100 text-violet-700"><UserRound size={18} /></div>
          <div>
            <p className="text-sm font-bold text-gray-900">3. Ação</p>
            <p className="text-xs text-gray-500 mt-1">Efeito: só responder, entregar ao humano, ou salvar dado na ficha do lead.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 flex justify-between items-center gap-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar bot..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm w-full transition-all"
            />
          </div>
          <button onClick={abrirNovo} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary transition-colors flex items-center gap-2 shadow-sm shadow-black/20">
            <Plus size={18} /> Novo Bot
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {carregando ? (
            <div className="text-center py-16 text-gray-400 text-sm">Carregando bots...</div>
          ) : botsFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <Bot size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Nenhum bot encontrado. Crie o primeiro para começar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {botsFiltrados.map(bot => (
                <div key={bot.id} className="p-4 rounded-2xl border transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 flex items-start gap-3">
                  <div className="text-gray-300 mt-1"><GripVertical size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{bot.nome}</h3>
                      {!bot.ativo && (
                        <span className="text-[10px] font-bold uppercase bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Desativado</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${TRIGGER_CORES[bot.tipoTrigger] ?? 'bg-gray-100 text-gray-700'}`}>
                        Trigger: {label(TRIGGER_OPCOES, bot.tipoTrigger)}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-sky-100 text-sky-700">
                        Reação: {label(REACAO_OPCOES, bot.tipoReacao)}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-violet-100 text-violet-700">
                        Ação: {label(ACAO_OPCOES, bot.acaoBot)}
                      </span>
                      {bot.acaoBot === 'SalvarLead' && bot.campoLead && (
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-amber-100 text-amber-700">
                          <Database size={10} className="inline mr-1" />{bot.campoLead}
                        </span>
                      )}
                    </div>
                    {bot.valorTrigger && (
                      <p className="text-xs text-gray-400 mt-2 font-mono truncate">
                        <Filter size={10} className="inline mr-1" />{bot.valorTrigger}
                      </p>
                    )}
                    {bot.tipoReacao === 'Texto' && bot.textoResposta && (
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2 italic">"{bot.textoResposta}"</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] text-gray-300 font-semibold">Ordem {bot.ordem}</span>
                    <div className="flex gap-1">
                      <button onClick={() => abrirEdicao(bot)} className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-gray-900 transition-colors" title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => { setDeletando(bot); setModalAberto(true); }} className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalAberto && !deletando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => { setModalAberto(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-serif font-bold text-gray-900">{editando ? 'Editar Bot' : 'Novo Bot'}</h2>
              <button onClick={() => setModalAberto(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nome do bot *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex.: Consultar preço"
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Trigger *</label>
                  <select
                    value={form.tipoTrigger}
                    onChange={e => setForm({ ...form, tipoTrigger: e.target.value })}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary"
                  >
                    {TRIGGER_OPCOES.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Ordem *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.ordem}
                    onChange={e => setForm({ ...form, ordem: Number(e.target.value) || 1 })}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary"
                  />
                </div>
              </div>

              {form.tipoTrigger === 'PalavraChave' || form.tipoTrigger === 'Regex' || form.tipoTrigger === 'Igual' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    {form.tipoTrigger === 'PalavraChave' ? 'Palavras-chave (separadas por |)' : form.tipoTrigger === 'Regex' ? 'Padrão regex' : 'Texto exato'}
                  </label>
                  <input
                    type="text"
                    value={form.valorTrigger}
                    onChange={e => setForm({ ...form, valorTrigger: e.target.value })}
                    placeholder={form.tipoTrigger === 'PalavraChave' ? 'preço|preco|quanto custa|valor' : form.tipoTrigger === 'Regex' ? 'quanto\\s+custa|pre[çc]o' : 'quero um pedido'}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Reação *</label>
                <select
                  value={form.tipoReacao}
                  onChange={e => setForm({ ...form, tipoReacao: e.target.value })}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary"
                >
                  {REACAO_OPCOES.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
                </select>
              </div>

              {form.tipoReacao === 'Texto' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Texto da resposta *</label>
                  <textarea
                    value={form.textoResposta}
                    onChange={e => setForm({ ...form, textoResposta: e.target.value })}
                    rows={4}
                    placeholder="Use {nome}, {empresa} e {interesse} como variáveis."
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Variáveis: {'{nome}'} {'{empresa}'} {'{interesse}'}</p>
                </div>
              )}
              {form.tipoReacao === 'Menu' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Texto do menu (opcional)</label>
                  <textarea
                    value={form.textoResposta}
                    onChange={e => setForm({ ...form, textoResposta: e.target.value })}
                    rows={4}
                    placeholder="Deixe vazio para usar o menu padrão."
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 resize-none"
                  />
                </div>
              )}
              {(form.tipoReacao === 'PrecoProduto' || form.tipoReacao === 'EstoqueProduto') && (
                <p className="text-[11px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                  O bot extrai o produto mencionado na mensagem do cliente e consulta os dados reais no catálogo.
                </p>
              )}
              {form.tipoReacao === 'StatusPedido' && (
                <p className="text-[11px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                  O bot consulta o status real do pedido vinculado ao atendimento, ou pelo número informado pelo cliente.
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Ação *</label>
                <select
                  value={form.acaoBot}
                  onChange={e => setForm({ ...form, acaoBot: e.target.value })}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary"
                >
                  {ACAO_OPCOES.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
                </select>
              </div>

              {form.acaoBot === 'SalvarLead' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Campo do lead a preencher</label>
                  <select
                    value={form.campoLead}
                    onChange={e => setForm({ ...form, campoLead: e.target.value })}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary"
                  >
                    <option value="">Selecione...</option>
                    {CAMPOS_LEAD.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">O valor é extraído automaticamente da mensagem do cliente (ex.: "moro em Boa Viagem" → preenche Bairro).</p>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, ativo: !form.ativo })}
                  className={`w-11 h-6 rounded-full relative transition-colors ${form.ativo ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 border border-gray-300 transition-all ${form.ativo ? 'left-6' : 'left-1'}`} />
                </button>
                <span className="text-sm text-gray-700">{form.ativo ? 'Bot ativo' : 'Bot desativado'}</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModalAberto(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={salvar} disabled={!form.nome.trim()} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={16} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {deletando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => { setDeletando(null); setModalAberto(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Excluir bot?</h3>
            <p className="text-sm text-gray-500 mb-5">O bot <strong>"{deletando.nome}"</strong> deixará de responder automaticamente. Essa ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => { setDeletando(null); setModalAberto(false); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
