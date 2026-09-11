import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, ImageIcon, UploadCloud, Loader2, Link as LinkIcon, CalendarDays, ArrowUpDown, Store, Image as ImageLucide } from 'lucide-react';
import { bannerService, type Banner, type CriarBannerDto, type TipoLinkBanner, type PosicaoBanner } from '../services/bannerService';
import { produtoService, type Produto } from '../services/produtoService';
import { categoriaService, type Categoria } from '../services/categoriaService';
import { departamentoService, type Departamento } from '../services/departamentoService';
import { uploadService } from '../services/uploadService';
import { midiaUrl } from '../utils/imageUrl';

const POSICOES: { value: PosicaoBanner; nome: string; descricao: string }[] = [
  { value: 'ambos', nome: 'Carrossel + Seções', descricao: 'Aparece no carrossel do topo e também entre as seções da home.' },
  { value: 'carrossel', nome: 'Carrossel do topo', descricao: 'Exibido somente no carrossel rotativo logo abaixo do hero.' },
  { value: 'secao', nome: 'Entre seções', descricao: 'Exibido somente como banner de bloco entre as seções da home.' },
];

const TIPOS_LINK: { value: TipoLinkBanner; nome: string }[] = [
  { value: '', nome: 'Sem link' },
  { value: 'produto', nome: 'Produto' },
  { value: 'departamento', nome: 'Departamento' },
  { value: 'categoria', nome: 'Categoria' },
  { value: 'externo', nome: 'Link externo' },
];

interface FormBanner {
  titulo: string;
  subtitulo: string;
  imagemUrl: string;
  linkTipo: TipoLinkBanner;
  linkValor: string;
  posicao: PosicaoBanner;
  ordem: number;
  ativo: boolean;
  dataInicio: string;
  dataFim: string;
}

const FORM_VAZIO: FormBanner = {
  titulo: '',
  subtitulo: '',
  imagemUrl: '',
  linkTipo: '',
  linkValor: '',
  posicao: 'ambos',
  ordem: 1,
  ativo: true,
  dataInicio: '',
  dataFim: '',
};

function toForm(b: Banner): FormBanner {
  return {
    titulo: b.titulo,
    subtitulo: b.subtitulo ?? '',
    imagemUrl: b.imagemUrl,
    linkTipo: b.linkTipo,
    linkValor: b.linkValor ?? '',
    posicao: b.posicao,
    ordem: b.ordem,
    ativo: b.ativo,
    dataInicio: b.dataInicio ? localDateTime(new Date(b.dataInicio)) : '',
    dataFim: b.dataFim ? localDateTime(new Date(b.dataFim)) : '',
  };
}

function localDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function bannerParaDto(b: Banner): CriarBannerDto {
  return {
    titulo: b.titulo,
    subtitulo: b.subtitulo ?? undefined,
    imagemUrl: b.imagemUrl,
    linkTipo: b.linkTipo,
    linkValor: b.linkValor ?? undefined,
    posicao: b.posicao,
    ordem: b.ordem,
    ativo: b.ativo,
    dataInicio: b.dataInicio ? new Date(b.dataInicio) : null,
    dataFim: b.dataFim ? new Date(b.dataFim) : null,
  };
}

export const rotuloPosicao = (p: string) => POSICOES.find(x => x.value === p)?.nome ?? p;
export const rotuloLink = (b: Banner) => {
  if (!b.linkTipo) return 'Sem link';
  if (b.linkTipo === 'produto') return `Produto #${b.linkValor}`;
  if (b.linkTipo === 'departamento') return `Departamento #${b.linkValor}`;
  if (b.linkTipo === 'categoria') return `Categoria #${b.linkValor}`;
  return b.linkValor ?? 'Externo';
};

export default function BannersAdmin() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormBanner>(FORM_VAZIO);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setCarregando(true);
    const [lista, prods, cats, deps] = await Promise.all([
      bannerService.getBanners(),
      produtoService.getProdutos(),
      categoriaService.getCategorias(),
      departamentoService.getDepartamentos(),
    ]);
    setBanners(lista);
    setProdutos(prods);
    setCategorias(cats);
    setDepartamentos(deps);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ ...FORM_VAZIO, ordem: banners.length + 1 });
    setErro('');
    setModalAberto(true);
  };

  const abrirEdicao = (b: Banner) => {
    setEditando(b);
    setForm(toForm(b));
    setErro('');
    setModalAberto(true);
  };

  const uploadImagem = async (file: File | undefined) => {
    if (!file) return;
    setEnviandoImagem(true);
    const url = await uploadService.uploadImagem(file);
    if (url) setForm(f => ({ ...f, imagemUrl: url }));
    setEnviandoImagem(false);
  };

  const salvar = async () => {
    if (!form.titulo.trim()) {
      setErro('Informe o título do banner.');
      return;
    }
    if (!form.imagemUrl) {
      setErro('Envie a imagem do banner.');
      return;
    }
    setSalvando(true);
    setErro('');
    const dto: CriarBannerDto = {
      titulo: form.titulo,
      subtitulo: form.subtitulo || undefined,
      imagemUrl: form.imagemUrl,
      linkTipo: form.linkTipo,
      linkValor: form.linkValor || undefined,
      posicao: form.posicao,
      ordem: form.ordem || 1,
      ativo: form.ativo,
      dataInicio: form.dataInicio ? new Date(form.dataInicio) : null,
      dataFim: form.dataFim ? new Date(form.dataFim) : null,
    };
    const ok = editando
      ? await bannerService.atualizarBanner(editando.id, dto)
      : !!(await bannerService.criarBanner(dto));
    setSalvando(false);
    if (ok) {
      setModalAberto(false);
      await carregar();
    } else {
      setErro('Não foi possível salvar o banner. Tente novamente.');
    }
  };

  const excluir = async (b: Banner) => {
    if (!confirm(`Excluir o banner "${b.titulo}"?`)) return;
    if (await bannerService.deletarBanner(b.id)) await carregar();
  };

  const toggleAtivo = async (b: Banner) => {
    await bannerService.atualizarBanner(b.id, { ...bannerParaDto(b), ativo: !b.ativo });
    await carregar();
  };

  const mover = async (b: Banner, direcao: -1 | 1) => {
    const ordenados = [...banners].sort((x, y) => x.ordem - y.ordem || x.id - y.id);
    const idx = ordenados.findIndex(x => x.id === b.id);
    const alvo = ordenados[idx + direcao];
    if (!alvo) return;
    const tmp = b.ordem;
    await bannerService.atualizarBanner(b.id, { ...bannerParaDto(b), ordem: alvo.ordem });
    await bannerService.atualizarBanner(alvo.id, { ...bannerParaDto(alvo), ordem: tmp });
    await carregar();
  };

  const produtoSelecionado = form.linkTipo === 'produto' && form.linkValor
    ? produtos.find(p => p.id === Number(form.linkValor))
    : null;
  const categoriaSelecionada = form.linkTipo === 'categoria' && form.linkValor
    ? categorias.find(c => c.id === Number(form.linkValor))
    : null;
  const departamentoSelecionado = form.linkTipo === 'departamento' && form.linkValor
    ? departamentos.find(d => d.id === Number(form.linkValor))
    : null;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><ImageLucide size={18} className="text-black" /> Banners de Venda</h3>
            <p className="text-xs text-gray-400 mt-0.5 max-w-xl">
              Banners promocionais exibidos na loja pública, como no site da Mundo Verde. Envie uma imagem, escolha onde exibir (carrossel do topo e/ou entre seções) e o destino ao clicar.
            </p>
          </div>
          <button onClick={abrirNovo} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary transition-colors shadow-sm">
            <Plus size={16} /> Novo Banner
          </button>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-gray-200 rounded-2xl bg-white/60">
            <ImageIcon size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">Nenhum banner cadastrado ainda.</p>
            <p className="text-gray-400 text-xs mt-1">Clique em "Novo Banner" para criar o primeiro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 min-w-[820px]">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-3 pr-4 font-medium">Banner</th>
                  <th className="py-3 px-4 font-medium">Posição</th>
                  <th className="py-3 px-4 font-medium">Destino do clique</th>
                  <th className="py-3 px-4 font-medium w-36">Ordem</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 pl-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[...banners]
                  .sort((a, b) => a.ordem - b.ordem || a.id - b.id)
                  .map((b, i, arr) => (
                    <tr key={b.id} className="border-b border-gray-100 hover:bg-white/60">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-24 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                            {b.imagemUrl ? (
                              <img src={midiaUrl(b.imagemUrl)} alt={b.titulo} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon size={18} className="text-gray-300" /></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[220px]">{b.titulo}</p>
                            {b.subtitulo && <p className="text-xs text-gray-400 truncate max-w-[220px]">{b.subtitulo}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
                          {b.posicao === 'carrossel' ? 'Carrossel' : b.posicao === 'secao' ? 'Entre seções' : 'Carrossel + Seções'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                          <LinkIcon size={13} className="text-gray-400" /> {rotuloLink(b)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => mover(b, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500"><ArrowUpDown size={14} className="rotate-180" /></button>
                          <span className="w-8 text-center text-sm font-medium text-gray-700">{b.ordem}</span>
                          <button onClick={() => mover(b, 1)} disabled={i === arr.length - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500"><ArrowUpDown size={14} /></button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleAtivo(b)} className={`w-11 h-6 rounded-full transition-all relative ${b.ativo ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm border border-gray-300 transition-all ${b.ativo ? 'left-6' : 'left-1'}`} />
                        </button>
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => abrirEdicao(b)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Editar"><Pencil size={16} /></button>
                          <button onClick={() => excluir(b)} className="p-2 rounded-lg hover:bg-red-50 text-red-400" title="Excluir"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold text-gray-900">{editando ? 'Editar Banner' : 'Novo Banner'}</h2>
              <button onClick={() => setModalAberto(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do banner *</label>
                <div className="flex items-start gap-4">
                  <div className="w-44 h-24 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {form.imagemUrl ? (
                      <img src={midiaUrl(form.imagemUrl)} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <ImageIcon size={26} className="mx-auto text-gray-300 mb-1" />
                        <span className="text-[11px] text-gray-400">Sem imagem</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary transition-colors cursor-pointer shadow-sm w-fit">
                      <UploadCloud size={16} /> {enviandoImagem ? 'Enviando...' : 'Enviar imagem'}
                      <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => uploadImagem(e.target.files?.[0])} disabled={enviandoImagem} />
                    </label>
                    <p className="text-[11px] text-gray-400 italic">PNG ou JPG. Ideal 1920×600 (carrossel) ou 900×400 (seções).</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" placeholder="Ex.: Semana de Ofertas" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                  <input type="text" value={form.subtitulo} onChange={e => setForm({ ...form, subtitulo: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" placeholder="Ex.: Até 30% off em produtos selecionados" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Posição de exibição</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {POSICOES.map(opc => (
                    <button key={opc.value} onClick={() => setForm({ ...form, posicao: opc.value })} className={`text-left p-3 rounded-xl border transition-all ${form.posicao === opc.value ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <p className="font-medium text-gray-900 text-xs">{opc.nome}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{opc.descricao}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destino ao clicar</label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {TIPOS_LINK.map(tipo => (
                    <button key={tipo.value} onClick={() => setForm({ ...form, linkTipo: tipo.value, linkValor: '' })} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.linkTipo === tipo.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {tipo.nome}
                    </button>
                  ))}
                </div>

                {form.linkTipo === 'produto' && (
                  <select value={form.linkValor} onChange={e => setForm({ ...form, linkValor: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                    <option value="">Selecione um produto...</option>
                    {produtos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                )}

                {form.linkTipo === 'departamento' && (
                  <select value={form.linkValor} onChange={e => setForm({ ...form, linkValor: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                    <option value="">Selecione um departamento...</option>
                    {departamentos.map(d => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                )}

                {form.linkTipo === 'categoria' && (
                  <select value={form.linkValor} onChange={e => setForm({ ...form, linkValor: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                    <option value="">Selecione uma categoria...</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                )}

                {form.linkTipo === 'externo' && (
                  <input type="text" value={form.linkValor} onChange={e => setForm({ ...form, linkValor: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" placeholder="https://..." />
                )}

                {produtoSelecionado && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5"><Store size={13} /> Abre o produto "{produtoSelecionado.nome}"</p>
                )}
                {categoriaSelecionada && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5"><Store size={13} /> Filtra o catálogo pela categoria "{categoriaSelecionada.nome}"</p>
                )}
                {departamentoSelecionado && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5"><Store size={13} /> Filtra o catálogo pelo departamento "{departamentoSelecionado.nome}"</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordem *</label>
                  <input type="number" min={1} value={form.ordem} onChange={e => setForm({ ...form, ordem: parseInt(e.target.value) || 1 })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início (opcional)</label>
                  <input type="datetime-local" value={form.dataInicio} onChange={e => setForm({ ...form, dataInicio: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fim (opcional)</label>
                  <input type="datetime-local" value={form.dataFim} onChange={e => setForm({ ...form, dataFim: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <div className="font-medium text-gray-900 text-sm flex items-center gap-2"><CalendarDays size={15} className="text-gray-400" /> Banner ativo</div>
                  <div className="text-xs text-gray-400">Desligue para ocultar temporariamente sem excluir.</div>
                </div>
                <button onClick={() => setForm({ ...form, ativo: !form.ativo })} className={`w-11 h-6 rounded-full transition-all relative ${form.ativo ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm border border-gray-300 transition-all ${form.ativo ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {erro && (
              <div className="mt-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 text-center">{erro}</div>
            )}

            <div className="flex gap-3 justify-end mt-8">
              <button onClick={() => setModalAberto(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={salvar} disabled={salvando || !form.titulo.trim() || !form.imagemUrl} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${salvando || !form.titulo.trim() || !form.imagemUrl ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary'}`}>
                {salvando ? <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Salvando...</span> : editando ? 'Salvar Alterações' : 'Cadastrar Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}