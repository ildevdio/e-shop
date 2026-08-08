import { useState, useRef, useEffect } from 'react';
import { Plus, X, Upload, FileCheck, Trash2, Search, Filter, Calendar, RotateCcw, Loader2, ShieldAlert, Package, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { pedidoService, type Pedido } from '../services/pedidoService';
import { clienteService, type Cliente } from '../services/clienteService';
import { produtoService, type Produto } from '../services/produtoService';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import SearchAutocomplete from '../components/SearchAutocomplete';
import { buscarCEP } from '../utils/buscarCEP';
import { formatEstoque } from '../utils/formatEstoque';

const STATUS_LABELS: Record<string, string> = {
  BloqueadoFinanceiro: 'Pendente de Lib. Financeira',
  AguardandoConfirmacao: 'Aguardando Confirmação',
  Pendente: 'Pendente',
  EmProducao: 'Em Produção',
  EmSeparacao: 'Em Separação',
  EmConferencia: 'Em Conferência',
  ProntoEntrega: 'Pronto p/ Entrega',
  ProntoRetirada: 'Pronto p/ Retirada',
  EmEntrega: 'Em Entrega',
  Entregue: 'Entregue',
  Devolvido: 'Devolvido',
};

const STATUS_GROUPS: Record<string, string[]> = {
  'Ativos': ['AguardandoConfirmacao', 'Pendente', 'EmProducao', 'EmSeparacao', 'EmConferencia', 'ProntoEntrega', 'ProntoRetirada', 'EmEntrega'],
  'Finalizados': ['Entregue'],
  'Cancelados': ['Devolvido'],
};

const PENDENTES_STATUSES = ['BloqueadoFinanceiro', 'AguardandoConfirmacao', 'Pendente', 'EmProducao', 'EmSeparacao', 'EmConferencia', 'ProntoEntrega', 'ProntoRetirada', 'EmEntrega'];

type StatusGroup = 'Todos' | 'Ativos' | 'Finalizados' | 'Cancelados';
type AbaPedidos = 'pendentes' | 'consulta';

interface ItemForm {
  produtoId: number;
  produto?: Produto;
  quantidade: number;
  precoUnitario: number;
}

export default function ComercialPedidos() {
  const { setModalAberto } = useUiStore();
  const { setores } = useAuthStore();
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const isVendedor = setores.some(s => normalize(s) === 'vendedor');
  const [abaAtiva, setAbaAtiva] = useState<AbaPedidos>('pendentes');
  const [cadastrando, setCadastrando] = useState(false);
  const [abaCadastro, setAbaCadastro] = useState<'produtos' | 'entrega'>('produtos');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [buscaConsulta, setBuscaConsulta] = useState('');
  const [buscaPendentes, setBuscaPendentes] = useState('');
  const [filtroStatusConsulta, setFiltroStatusConsulta] = useState<StatusGroup>('Todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroTipoConsulta, setFiltroTipoConsulta] = useState<'Todos' | 'Entrega' | 'Retirada'>('Todos');
  const [resultadosConsulta, setResultadosConsulta] = useState<Pedido[]>([]);
  const [totalConsulta, setTotalConsulta] = useState(0);
  const [paginaConsulta, setPaginaConsulta] = useState(1);
  const [buscandoConsulta, setBuscandoConsulta] = useState(false);
  const [consultaRealizada, setConsultaRealizada] = useState(false);

  const [novoPedido, setNovoPedido] = useState({ clienteId: '', tipoEntrega: 'Entrega', pagamento: '', prazoPagamentoDias: '', desconto: '', acrescimo: '' });
  const [itensPedido, setItensPedido] = useState<ItemForm[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [destaqueProduto, setDestaqueProduto] = useState(0);
  const [selecionadosPedido, setSelecionadosPedido] = useState<Set<number>>(new Set());
  const [ancoraPedido, setAncoraPedido] = useState<number | null>(null);
  const [cargaQtd, setCargaQtd] = useState('');
  const [erroProduto, setErroProduto] = useState('');
  const [davFile, setDavFile] = useState<File | null>(null);
  const davInputRef = useRef<HTMLInputElement>(null);
  const [pedidoPendenteDialog, setPedidoPendenteDialog] = useState<Pedido[] | null>(null);
  const [detalhe, setDetalhe] = useState<Pedido | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [showBloqueadoDialog, setShowBloqueadoDialog] = useState(false);
  const [clienteBloqueadoSelecionado, setClienteBloqueadoSelecionado] = useState<Cliente | null>(null);
  const [novoCliente, setNovoCliente] = useState({ razaoSocialNome: '', cpfCnpj: '', telefone: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' });
  const [editDetalhe, setEditDetalhe] = useState<{
    tipoEntrega: string;
    pagamento: string;
    prazoPagamentoDias: number | '';
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    desconto: number;
    acrescimo: number;
    valorTotal: number;
    observacao: string;
    itens: { id: number; quantidade: number; precoUnitario: number }[];
  } | null>(null);
  const editando = detalhe != null && !isVendedor && !['Entregue', 'Devolvido', 'BloqueadoFinanceiro'].includes(detalhe.status);
  const [buscandoCEP, setBuscandoCEP] = useState<'novo' | 'edit' | null>(null);

  const handleBuscarCEPNovo = async () => {
    setBuscandoCEP('novo');
    const resultado = await buscarCEP(novoCliente.cep);
    if (resultado) {
      setNovoCliente(f => ({
        ...f,
        logradouro: resultado.logradouro || f.logradouro,
        bairro: resultado.bairro || f.bairro,
        cidade: resultado.cidade || f.cidade,
        estado: resultado.estado || f.estado,
      }));
    }
    setBuscandoCEP(null);
  };

  const handleBuscarCEPEdit = async () => {
    if (!editDetalhe) return;
    setBuscandoCEP('edit');
    const resultado = await buscarCEP(editDetalhe.cep);
    if (resultado) {
      setEditDetalhe(f => f ? {
        ...f,
        logradouro: resultado.logradouro || f.logradouro,
        complemento: resultado.complemento || f.complemento,
        bairro: resultado.bairro || f.bairro,
        cidade: resultado.cidade || f.cidade,
        estado: resultado.estado || f.estado,
      } : f);
    }
    setBuscandoCEP(null);
  };

  const carregar = async () => {
    setCarregando(true);
    const [p, c, pr] = await Promise.all([
      pedidoService.getPedidos(),
      clienteService.getClientes(),
      produtoService.getProdutos(),
    ]);
    setPedidos(p);
    setClientes(c);
    setProdutos(pr);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const handleDavUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Somente arquivos PDF são aceitos para DAV.');
      return;
    }
    setDavFile(file);
  };

  const abrirDetalhe = (pedido: Pedido) => {
    setDetalhe(pedido);
    setEditDetalhe({
      tipoEntrega: pedido.tipoEntrega,
      pagamento: pedido.pagamento ?? '',
      prazoPagamentoDias: pedido.prazoPagamentoDias ?? '',
      cep: pedido.cep ?? '',
      logradouro: pedido.logradouro ?? '',
      numero: pedido.numero ?? '',
      complemento: pedido.complemento ?? '',
      bairro: pedido.bairro ?? '',
      cidade: pedido.cidade ?? '',
      estado: pedido.estado ?? '',
      desconto: pedido.desconto,
      acrescimo: pedido.acrescimo,
      valorTotal: pedido.valorTotal,
      observacao: pedido.observacao ?? '',
      itens: pedido.itens.map(i => ({ id: i.id, quantidade: i.quantidade, precoUnitario: i.precoUnitario })),
    });
    setModalAberto(true);
  };

  const fecharDetalhe = () => {
    setDetalhe(null);
    setEditDetalhe(null);
    setModalAberto(false);
  };

  const normalizarNome = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const termoProduto = normalizarNome(buscaProduto.trim());

  const sugestoesProdutos = produtos
    .filter(p => p.ativo && !itensPedido.some(i => i.produtoId === p.id))
    .filter(p => !termoProduto || normalizarNome(p.nome).includes(termoProduto))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, 50);

  const adicionarProduto = (p: Produto) => {
    if (itensPedido.some(i => i.produtoId === p.id)) return;
    if (p.estoque <= 0) {
      setErroProduto(`O produto "${p.nome}" está sem estoque para venda.`);
      return;
    }
    setItensPedido([...itensPedido, { produtoId: p.id, produto: p, quantidade: 1, precoUnitario: p.precoVarejo }]);
    setSelecionadosPedido(new Set([itensPedido.length]));
    setAncoraPedido(itensPedido.length);
    setBuscaProduto('');
    setDestaqueProduto(0);
    setErroProduto('');
  };

  const atualizarItem = (index: number, campo: keyof ItemForm, valor: number) => {
    const atualizados = [...itensPedido];
    (atualizados[index] as any)[campo] = valor;
    setItensPedido(atualizados);
  };

  const removerItem = (index: number) => {
    setItensPedido(prev => prev.filter((_, i) => i !== index));
    setSelecionadosPedido(prev => {
      const next = new Set<number>();
      prev.forEach(i => {
        if (i === index) return;
        next.add(i > index ? i - 1 : i);
      });
      return next;
    });
    if (ancoraPedido === index) setAncoraPedido(null);
    else if (ancoraPedido !== null && ancoraPedido > index) setAncoraPedido(ancoraPedido - 1);
  };

  const limparLista = () => {
    setItensPedido([]);
    setSelecionadosPedido(new Set());
    setAncoraPedido(null);
    setErroProduto('');
  };

  const selecionarUnico = (index: number) => {
    setSelecionadosPedido(new Set([index]));
    setAncoraPedido(index);
  };

  const alternarSelecao = (index: number) => {
    setSelecionadosPedido(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    setAncoraPedido(index);
  };

  const selecionarIntervalo = (index: number) => {
    if (ancoraPedido === null) {
      setSelecionadosPedido(new Set([index]));
      setAncoraPedido(index);
      return;
    }
    const [menor, maior] = ancoraPedido < index ? [ancoraPedido, index] : [index, ancoraPedido];
    setSelecionadosPedido(new Set(Array.from({ length: maior - menor + 1 }, (_, i) => menor + i)));
    setAncoraPedido(index);
  };

  const aoClicarLinha = (e: React.MouseEvent, index: number) => {
    if (e.shiftKey) selecionarIntervalo(index);
    else if (e.ctrlKey || e.metaKey) alternarSelecao(index);
    else selecionarUnico(index);
  };

  const removerSelecionados = () => {
    setItensPedido(prev => prev.filter((_, i) => !selecionadosPedido.has(i)));
    setSelecionadosPedido(new Set());
    setAncoraPedido(null);
  };

  const adicionarDestaque = () => {
    const p = sugestoesProdutos[destaqueProduto] ?? sugestoesProdutos[0];
    if (p) adicionarProduto(p);
  };

  const handleBuscaProdutoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDestaqueProduto(prev => Math.min(prev + 1, sugestoesProdutos.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestaqueProduto(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      adicionarDestaque();
    }
  };

  const aplicarCarga = () => {
    const valor = parseFloat(cargaQtd.replace(',', '.'));
    if (isNaN(valor) || valor < 0) {
      setErroProduto('Informe uma quantidade válida para a carga.');
      return;
    }
    setErroProduto('');
    setItensPedido(prev => prev.map((item, i) => selecionadosPedido.has(i) ? { ...item, quantidade: valor } : item));
  };

  const pesoTotalItens = itensPedido.reduce((acc, item) => acc + (item.produto?.pesoUnidade ?? 0) * item.quantidade, 0);
  const valorTotalCalc = itensPedido.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);

  const selecionarCliente = (clienteId: string) => {
    if (!clienteId) {
      setNovoPedido({ ...novoPedido, clienteId: '' });
      return;
    }
    const cliente = clientes.find(c => c.id === parseInt(clienteId));
    if (cliente?.bloqueadoFinanceiro) {
      setClienteBloqueadoSelecionado(cliente);
      setShowBloqueadoDialog(true);
      setModalAberto(true);
      return;
    }
    const pendentes = pedidos.filter(p =>
      p.clienteId === parseInt(clienteId) &&
      PENDENTES_STATUSES.includes(p.status)
    );
    if (pendentes.length > 0) {
      setPedidoPendenteDialog(pendentes);
      setModalAberto(true);
    } else {
      setNovoPedido({ ...novoPedido, clienteId });
    }
  };

  const confirmarClienteBloqueado = () => {
    if (!clienteBloqueadoSelecionado) return;
    const pendentes = pedidos.filter(p =>
      p.clienteId === clienteBloqueadoSelecionado.id &&
      PENDENTES_STATUSES.includes(p.status)
    );
    setShowBloqueadoDialog(false);
    setModalAberto(false);
    setClienteBloqueadoSelecionado(null);
    if (pendentes.length > 0) {
      setPedidoPendenteDialog(pendentes);
      setModalAberto(true);
    } else {
      setNovoPedido({ ...novoPedido, clienteId: String(clienteBloqueadoSelecionado.id) });
    }
  };

  const cancelarClienteBloqueado = () => {
    setShowBloqueadoDialog(false);
    setModalAberto(false);
    setClienteBloqueadoSelecionado(null);
    setBuscaCliente('');
    setNovoPedido({ ...novoPedido, clienteId: '' });
  };

  const criarCliente = async () => {
    if (!novoCliente.razaoSocialNome.trim()) return;
    const cli = await clienteService.criarCliente({
      razaoSocialNome: novoCliente.razaoSocialNome,
      cpfCnpj: novoCliente.cpfCnpj,
      telefone: novoCliente.telefone,
      cep: novoCliente.cep,
      logradouro: novoCliente.logradouro,
      numero: novoCliente.numero,
      bairro: novoCliente.bairro,
      cidade: novoCliente.cidade,
      estado: novoCliente.estado,
    });
    if (cli) {
      setClientes(prev => [...prev, cli]);
      if (detalhe && !detalhe.clienteId) {
        await pedidoService.vincularCliente(detalhe.id, cli.id);
        setDetalhe({ ...detalhe, clienteId: cli.id, cliente: { id: cli.id, razaoSocialNome: cli.razaoSocialNome, cpfCnpj: cli.cpfCnpj, bairro: cli.bairro, logradouro: cli.logradouro, numero: cli.numero, telefone: cli.telefone } });
        await carregar();
      } else {
        setBuscaCliente(cli.razaoSocialNome);
        selecionarCliente(String(cli.id));
      }
      setShowNovoCliente(false);
      setModalAberto(false);
      setNovoCliente({ razaoSocialNome: '', cpfCnpj: '', telefone: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' });
    }
  };

  const handleAcrecimo = () => {
    if (pedidoPendenteDialog && pedidoPendenteDialog.length > 0) {
      const pedido = pedidoPendenteDialog[0];
      setPedidoPendenteDialog(null);
      setModalAberto(false);
      resetModal();
      abrirDetalhe(pedido);
    }
  };

  const handleNovoPedido = () => {
    if (pedidoPendenteDialog && pedidoPendenteDialog.length > 0) {
      setNovoPedido({ ...novoPedido, clienteId: String(pedidoPendenteDialog[0].clienteId) });
    }
    setPedidoPendenteDialog(null);
    setModalAberto(false);
  };

  const criarPedido = async () => {
    if (!novoPedido.clienteId || itensPedido.length === 0 || itensPedido.some(i => !i.produtoId)) return;
    const clienteId = parseInt(novoPedido.clienteId);
    const desconto = parseFloat(novoPedido.desconto.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const acrescimo = parseFloat(novoPedido.acrescimo.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const pedido = await pedidoService.criarPedido({
      clienteId,
      valorTotal: valorTotalCalc,
      pesoTotal: pesoTotalItens,
      tipoEntrega: novoPedido.tipoEntrega,
      pagamento: novoPedido.pagamento || undefined,
      prazoPagamentoDias: novoPedido.pagamento === 'Boleto' && novoPedido.prazoPagamentoDias ? parseInt(novoPedido.prazoPagamentoDias) : undefined,
      desconto,
      acrescimo,
      itens: itensPedido.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade, precoUnitario: i.precoUnitario, pesoUnitario: i.produto?.pesoUnidade ?? 0 })),
    });
    if (!pedido) return;
    setNovoPedido({ clienteId: '', tipoEntrega: 'Entrega', pagamento: '', prazoPagamentoDias: '', desconto: '', acrescimo: '' });
    setItensPedido([]);
    setBuscaProduto('');
    setDestaqueProduto(0);
    setSelecionadosPedido(new Set());
    setAncoraPedido(null);
    setCargaQtd('');
    setErroProduto('');
    setDavFile(null);
    setCadastrando(false);
    setModalAberto(false);
    await carregar();
  };

  const resetModal = () => {
    setNovoPedido({ clienteId: '', tipoEntrega: 'Entrega', pagamento: '', prazoPagamentoDias: '', desconto: '', acrescimo: '' });
    setItensPedido([]);
    setBuscaProduto('');
    setDestaqueProduto(0);
    setSelecionadosPedido(new Set());
    setAncoraPedido(null);
    setCargaQtd('');
    setErroProduto('');
    setDavFile(null);
    setCadastrando(false);
    setModalAberto(false);
  };

  const pedidosPendentes = pedidos.filter(p => {
    if (!PENDENTES_STATUSES.includes(p.status)) return false;
    const termo = buscaPendentes.toLowerCase();
    if (termo) {
      return (
        String(p.id).includes(termo) ||
        p.cliente?.razaoSocialNome?.toLowerCase().includes(termo) ||
        p.solicitanteNome?.toLowerCase().includes(termo) ||
        p.cpfCnpj?.includes(termo) ||
        p.logradouro?.toLowerCase().includes(termo) ||
        p.bairro?.toLowerCase().includes(termo) ||
        p.cidade?.toLowerCase().includes(termo)
      );
    }
    return true;
  });

  const buscarConsulta = async (pagina: number = 1) => {
    setBuscandoConsulta(true);
    setConsultaRealizada(true);
    const statusParam = filtroStatusConsulta !== 'Todos'
      ? STATUS_GROUPS[filtroStatusConsulta]?.join(',')
      : undefined;
    const resultado = await pedidoService.buscarPedidos({
      busca: buscaConsulta || undefined,
      status: statusParam,
      tipoEntrega: filtroTipoConsulta !== 'Todos' ? filtroTipoConsulta : undefined,
      dataInicio: filtroDataInicio || undefined,
      dataFim: filtroDataFim || undefined,
      pagina,
      tamanhoPagina: 50,
    });
    setResultadosConsulta(resultado.dados);
    setTotalConsulta(resultado.total);
    setPaginaConsulta(resultado.pagina);
    setBuscandoConsulta(false);
  };

  const temFiltroAtivoConsulta = buscaConsulta || filtroStatusConsulta !== 'Todos' || filtroTipoConsulta !== 'Todos' || filtroDataInicio || filtroDataFim;

  const limparFiltros = () => {
    setBuscaConsulta('');
    setFiltroStatusConsulta('Todos');
    setFiltroTipoConsulta('Todos');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setResultadosConsulta([]);
    setTotalConsulta(0);
    setConsultaRealizada(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to="/comercial" className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 mt-1">Gestão de pedidos e DAVs do setor comercial.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <button onClick={() => setAbaAtiva('pendentes')} className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 rounded-xl transition-all ${abaAtiva === 'pendentes' ? 'bg-white shadow-sm text-black ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
          <FileCheck size={18} /> Pendentes de Finalização
          <span className="ml-1 text-xs opacity-50">
            ({pedidosPendentes.length})
          </span>
        </button>
        <button onClick={() => setAbaAtiva('consulta')} className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 rounded-xl transition-all ${abaAtiva === 'consulta' ? 'bg-white shadow-sm text-black ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
          <Search size={18} /> Consulta
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {cadastrando ? (
          <div className="flex flex-col h-full">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={resetModal} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-lg font-serif font-bold text-gray-900">Novo Pedido</h2>
                  <p className="text-gray-500 mt-0.5 text-sm">Preencha os dados do pedido e selecione os produtos.</p>
                </div>
              </div>
            </div>

            <div className="px-6 pt-4 pb-3 flex gap-2">
              <button
                onClick={() => setAbaCadastro('produtos')}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${abaCadastro === 'produtos' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Package size={16} /> Produtos
              </button>
              <button
                onClick={() => setAbaCadastro('entrega')}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${abaCadastro === 'entrega' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Truck size={16} /> Entrega
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {abaCadastro === 'produtos' ? (
                <div>
                  <div className="relative mb-3">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={buscaProduto}
                      onChange={e => { setBuscaProduto(e.target.value); setDestaqueProduto(0); }}
                      onKeyDown={handleBuscaProdutoKeyDown}
                      placeholder="Pesquise pelo nome e pressione Enter para adicionar..."
                      className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-black text-sm"
                    />
                    {termoProduto !== '' && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {sugestoesProdutos.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-400">Nenhum produto encontrado.</p>
                        ) : (
                          sugestoesProdutos.map((p, i) => (
                            <div
                              key={p.id}
                              onClick={() => setDestaqueProduto(i)}
                              onDoubleClick={() => adicionarProduto(p)}
                              className={`px-4 py-2.5 flex items-center justify-between gap-3 text-sm cursor-pointer select-none ${i === destaqueProduto ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                            >
                              <span className="font-medium text-gray-900 truncate">{p.nome}</span>
                              <span className="text-[11px] text-gray-400 shrink-0">
                                R$ {p.precoVarejo.toFixed(2)} · Est.: {formatEstoque(p.estoque)}{p.unidadeVenda ? ` ${p.unidadeVenda.toLowerCase()}` : ''}{p.estoque <= 0 ? ' (esgotado)' : ''}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 flex items-center gap-2">
                    <p className="text-xs text-gray-500 flex-1">
                      {itensPedido.length === 0
                        ? 'Pesquise um produto acima e pressione Enter (ou dê dois cliques) para adicioná-lo à lista.'
                        : selecionadosPedido.size === 0
                          ? 'Selecione um ou mais produtos da lista abaixo (Clique, Ctrl+clique, Shift+clique) para alterações em massa.'
                          : `Definir quantidade para os ${selecionadosPedido.size} produto${selecionadosPedido.size === 1 ? '' : 's'} selecionado${selecionadosPedido.size === 1 ? '' : 's'}:`}
                    </p>
                    {selecionadosPedido.size > 0 && (
                      <>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={cargaQtd}
                          onChange={e => setCargaQtd(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') aplicarCarga(); }}
                          placeholder="Qtd"
                          className="w-28 border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm text-right"
                        />
                        <button onClick={aplicarCarga} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shrink-0">
                          Aplicar
                        </button>
                      </>
                    )}
                  </div>

                  <div className="border border-gray-100 rounded-xl bg-white">
                    {itensPedido.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-14">
                        <Package size={32} className="text-gray-300 mb-3" />
                        <p className="text-sm text-gray-400">A lista está vazia.</p>
                        <p className="text-[11px] text-gray-300 mt-1">Adicione os produtos desejados pela busca acima.</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                            {itensPedido.length} produto{itensPedido.length === 1 ? '' : 's'} na lista{selecionadosPedido.size > 0 && <span className="text-amber-600"> · {selecionadosPedido.size} selecionado{selecionadosPedido.size === 1 ? '' : 's'}</span>}
                          </p>
                          <div className="flex items-center gap-3">
                            {selecionadosPedido.size > 0 && (
                              <button onClick={removerSelecionados} className="text-[11px] font-medium text-red-500 hover:text-red-700">
                                Remover selecionados ({selecionadosPedido.size})
                              </button>
                            )}
                            <button onClick={limparLista} className="text-[11px] font-medium text-gray-500 hover:text-gray-700">Limpar lista</button>
                          </div>
                        </div>
                        {itensPedido.map((item, index) => {
                          const selecionado = selecionadosPedido.has(index);
                          return (
                            <div
                              key={index}
                              onClick={e => aoClicarLinha(e, index)}
                              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer select-none transition-colors ${selecionado ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${selecionado ? 'text-gray-900' : 'text-gray-700'}`}>{item.produto?.nome}</p>
                                <p className="text-[11px] text-gray-400 truncate">
                                  {[item.produto?.categoria?.nome, item.produto?.marca?.nome, item.produto?.embalagem, item.produto?.unidadeVenda].filter(Boolean).join(' · ') || '—'} · Est.: {formatEstoque(item.produto?.estoque ?? 0)}
                                </p>
                              </div>
                              {selecionado && (
                                <>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={item.quantidade === 0 ? '' : item.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                                    onChange={e => atualizarItem(index, 'quantidade', parseFloat(e.target.value.replace(',', '.')) || 0)}
                                    onClick={e => e.stopPropagation()}
                                    placeholder="Qtd"
                                    className="w-20 border border-amber-300 bg-white rounded-lg p-2 outline-none focus:border-black text-sm text-right shrink-0"
                                  />
                                  <input
                                    type="text"
                                    value={item.precoUnitario === 0 ? '' : item.precoUnitario.toFixed(2)}
                                    onChange={e => atualizarItem(index, 'precoUnitario', parseFloat(e.target.value.replace(',', '.')) || 0)}
                                    onClick={e => e.stopPropagation()}
                                    placeholder={item.produto?.precoVarejo.toFixed(2) ?? '0,00'}
                                    className="w-24 border border-amber-300 bg-white rounded-lg p-2 outline-none focus:border-black text-sm text-right shrink-0"
                                  />
                                </>
                              )}
                              <button onClick={e => { e.stopPropagation(); removerItem(index); }} className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                                <X size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {erroProduto && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 mt-3">{erroProduto}</p>}

                  {itensPedido.length > 0 && (
                    <div className="text-xs text-gray-500 mt-2">
                      Peso total estimado: <strong>{pesoTotalItens.toFixed(2)} kg</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <SearchAutocomplete
                          placeholder="Buscar cliente por nome..."
                          valor={buscaCliente}
                          onChange={v => {
                            setBuscaCliente(v);
                            if (!v) setNovoPedido({ ...novoPedido, clienteId: '' });
                          }}
                          sugestoes={clientes
                            .filter(c => c.razaoSocialNome.toLowerCase().includes(buscaCliente.toLowerCase()) || c.cpfCnpj.includes(buscaCliente))
                            .map(c => ({ rotulo: c.razaoSocialNome, subRotulo: c.cpfCnpj || c.telefone || '' }))}
                          aoSelecionar={s => {
                            const c = clientes.find(cl => cl.razaoSocialNome === s.rotulo);
                            if (c) {
                              setBuscaCliente(c.razaoSocialNome);
                              selecionarCliente(String(c.id));
                            }
                          }}
                        />
                      </div>
                      <button type="button" onClick={() => { setShowNovoCliente(true); setModalAberto(true); }} className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors shrink-0 flex items-center gap-1">
                        <Plus size={16} /> Novo
                      </button>
                    </div>
                    {novoPedido.clienteId && (
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-gray-500">Selecionado: {clientes.find(c => c.id === parseInt(novoPedido.clienteId))?.razaoSocialNome}</p>
                        {clientes.find(c => c.id === parseInt(novoPedido.clienteId))?.bloqueadoFinanceiro && (
                          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <ShieldAlert size={14} className="text-amber-600 shrink-0" />
                            <span className="text-xs text-amber-700 font-medium">Este cliente está bloqueado pelo setor financeiro. O pedido ficará pendente de liberação.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Entrega</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNovoPedido({ ...novoPedido, tipoEntrega: 'Entrega' })}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${novoPedido.tipoEntrega === 'Entrega' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                      >
                        Entrega
                      </button>
                      <button
                        type="button"
                        onClick={() => setNovoPedido({ ...novoPedido, tipoEntrega: 'Retirada' })}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${novoPedido.tipoEntrega === 'Retirada' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                      >
                        Retirada
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                    <select
                      value={novoPedido.pagamento}
                      onChange={e => setNovoPedido({ ...novoPedido, pagamento: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm"
                    >
                      <option value="">Selecione...</option>
                      <option value="PIX">PIX</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Crédito Loja">Crédito Loja</option>
                      <option value="Fiado">Fiado</option>
                    </select>
                    {novoPedido.pagamento === 'Boleto' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (dias)</label>
                        <select
                          value={novoPedido.prazoPagamentoDias}
                          onChange={e => setNovoPedido({ ...novoPedido, prazoPagamentoDias: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm"
                        >
                          <option value="">Selecione...</option>
                          {[7, 14, 21, 30, 45, 60].map(d => <option key={d} value={d}>{d} dias</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
                      <div className="w-full border border-gray-200 bg-gray-50 rounded-lg p-2.5 text-sm text-gray-700">
                        R$ {valorTotalCalc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (R$)</label>
                      <input
                        type="text"
                        value={novoPedido.desconto}
                        onChange={e => setNovoPedido({ ...novoPedido, desconto: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acréscimo (R$)</label>
                      <input
                        type="text"
                        value={novoPedido.acrescimo}
                        onChange={e => setNovoPedido({ ...novoPedido, acrescimo: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo DAV (PDF)</label>
                    <input ref={davInputRef} type="file" accept=".pdf" className="hidden" onChange={handleDavUpload} />
                    {davFile ? (
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                        <FileCheck size={20} className="text-emerald-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-emerald-900 truncate">{davFile.name}</p>
                          <p className="text-[11px] text-emerald-600">{(davFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => setDavFile(null)} className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => davInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-all"
                      >
                        <Upload size={24} className="mb-2 text-gray-400" />
                        <p className="text-sm font-medium">Clique para enviar o PDF do DAV</p>
                        <p className="text-[11px] text-gray-400 mt-1">Somente arquivos .pdf</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={resetModal} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">
                Cancelar
              </button>
              <button
                onClick={criarPedido}
                disabled={!novoPedido.clienteId || itensPedido.length === 0 || itensPedido.some(i => !i.produtoId)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${
                  novoPedido.clienteId && itensPedido.length > 0 && !itensPedido.some(i => !i.produtoId)
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Criar Pedido
              </button>
            </div>
          </div>
        ) : (
        <div className="flex flex-col h-full min-h-0">
        {abaAtiva === 'pendentes' && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por #ID, cliente, CPF/CNPJ..."
                value={buscaPendentes}
                onChange={e => setBuscaPendentes(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm transition-all"
              />
            </div>
            <button
              onClick={() => { setBuscaCliente(''); setNovoPedido({ clienteId: '', tipoEntrega: 'Entrega', pagamento: '', prazoPagamentoDias: '', desconto: '', acrescimo: '' }); setItensPedido([]); setBuscaProduto(''); setDestaqueProduto(0); setSelecionadosPedido(new Set()); setAncoraPedido(null); setCargaQtd(''); setErroProduto(''); setCadastrando(true); setAbaCadastro('produtos'); }}
              className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm shadow-black/20"
            >
              <Plus size={18} /> Novo Pedido
            </button>
          </div>
        </div>
        )}

        {abaAtiva === 'consulta' && (
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filtros de Consulta</span>
              {temFiltroAtivoConsulta && (
                <span className="ml-1 w-2 h-2 rounded-full bg-black" />
              )}
            </div>
            <div className="flex items-center gap-3">
              {temFiltroAtivoConsulta && (
                <button onClick={limparFiltros} className="text-xs text-gray-500 hover:text-black flex items-center gap-1 transition-colors">
                  <RotateCcw size={12} /> Limpar filtros
                </button>
              )}
              <button
                onClick={() => buscarConsulta()}
                disabled={buscandoConsulta}
                className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm shadow-black/20 disabled:opacity-50"
              >
                <Search size={18} /> {buscandoConsulta ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Search className="text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por #ID, cliente, CPF/CNPJ, endereço..."
              value={buscaConsulta}
              onChange={e => setBuscaConsulta(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') buscarConsulta(); }}
              className="flex-1 px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {(['Todos', 'Ativos', 'Finalizados', 'Cancelados'] as StatusGroup[]).map(grupo => (
                  <button
                    key={grupo}
                    onClick={() => setFiltroStatusConsulta(grupo)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filtroStatusConsulta === grupo
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {grupo}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-[140px]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Tipo</label>
              <div className="flex gap-1.5">
                {(['Todos', 'Entrega', 'Retirada'] as const).map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setFiltroTipoConsulta(tipo)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filtroTipoConsulta === tipo
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Período</label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={e => setFiltroDataInicio(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black"
                />
              </div>
              <span className="text-gray-400 text-xs">até</span>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="date"
                  value={filtroDataFim}
                  onChange={e => setFiltroDataFim(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black"
                />
              </div>
            </div>
          </div>
        </div>
        )}

        {abaAtiva === 'pendentes' && !carregando && (
          <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-2">
            {PENDENTES_STATUSES.map(status => {
              const count = pedidos.filter(p => p.status === status).length;
              if (count === 0) return null;
              return (
                <span key={status} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-50 text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  {STATUS_LABELS[status]}: {count}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-x-auto">
          {carregando ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando pedidos...</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold">ID</th>
                  <th className="px-6 py-3 font-semibold">Cliente</th>
                  <th className="px-6 py-3 font-semibold">Valor</th>
                  <th className="px-6 py-3 font-semibold">Itens</th>
                  <th className="px-6 py-3 font-semibold">Peso</th>
                  <th className="px-6 py-3 font-semibold">Tipo</th>
                  <th className="px-6 py-3 font-semibold">Data</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(abaAtiva === 'pendentes' ? pedidosPendentes : resultadosConsulta).map(pedido => (
                  <tr key={pedido.id} onDoubleClick={() => abrirDetalhe(pedido)} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-medium text-gray-900">#{pedido.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{pedido.cliente?.razaoSocialNome ?? '—'}</span>
                        {pedido.cliente?.vendedor && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 ring-1 ring-violet-200">
                            {pedido.cliente.vendedor.nome}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">R$ {pedido.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">{pedido.itens?.length ?? 0} itens</td>
                    <td className="px-6 py-4">{pedido.pesoTotal.toFixed(2)} kg</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${pedido.tipoEntrega === 'Retirada' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'}`}>
                        {pedido.tipoEntrega === 'Retirada' ? 'Retirada' : 'Entrega'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{new Date(pedido.dataCriacao).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ${
                        pedido.status === 'BloqueadoFinanceiro' ? 'bg-amber-100 text-amber-700 ring-amber-300' :
                        'bg-gray-100 text-black ring-black/20'
                      }`}>
                        {STATUS_LABELS[pedido.status] ?? pedido.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => abrirDetalhe(pedido)} className="text-gray-700 hover:underline">Ver</button>
                    </td>
                  </tr>
                ))}
                {((abaAtiva === 'pendentes' && pedidosPendentes.length === 0) || (abaAtiva === 'consulta' && consultaRealizada && resultadosConsulta.length === 0)) && (
                  <tr><td colSpan={9} className="text-center py-16 text-gray-400 text-sm">
                    {abaAtiva === 'consulta' && !consultaRealizada ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                          <Search size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Nenhuma busca realizada</p>
                          <p className="text-xs mt-1">Use os filtros acima e clique em <strong>Buscar</strong> para pesquisar pedidos</p>
                        </div>
                      </div>
                    ) : 'Nenhum pedido encontrado com os filtros selecionados'}
                  </td></tr>
                )}
              </tbody>
            </table>
          )}

          {abaAtiva === 'consulta' && consultaRealizada && totalConsulta > 50 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  {totalConsulta} resultado{totalConsulta !== 1 ? 's' : ''} encontrado{totalConsulta !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => buscarConsulta(paginaConsulta - 1)}
                    disabled={paginaConsulta <= 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-500">Página {paginaConsulta}</span>
                  <button
                    onClick={() => buscarConsulta(paginaConsulta + 1)}
                    disabled={resultadosConsulta.length < 50}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
        </div>
        </div>
        )}
      </div>


      {pedidoPendenteDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-amber-600 text-lg font-bold">!</span>
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-900">Pedido pendente encontrado</h2>
                <p className="text-sm text-gray-500">
                  Este cliente possui {pedidoPendenteDialog.length} pedido{pedidoPendenteDialog.length > 1 ? 's' : ''} pendente{pedidoPendenteDialog.length > 1 ? 's' : ''} de finalização:
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              {pedidoPendenteDialog.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <span className="font-medium text-gray-900">#{p.id}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      R$ {p.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm text-gray-400 ml-2">
                      ({p.itens.length} {p.itens.length === 1 ? 'item' : 'itens'})
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.tipoEntrega === 'Retirada' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {p.tipoEntrega}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setPedidoPendenteDialog(null); setModalAberto(false); }}
                className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleNovoPedido}
                className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Novo Pedido
              </button>
              <button
                onClick={handleAcrecimo}
                className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
              >
                Acréscimo
              </button>
            </div>
          </div>
        </div>
      )}

      {detalhe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={fecharDetalhe}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">Detalhes do Pedido</h2>
              <button onClick={fecharDetalhe} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Pedido</span>
                <p className="text-gray-900 font-medium mt-0.5">#{detalhe.id}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Status</span>
                <p className="text-gray-900 font-medium mt-0.5">{STATUS_LABELS[detalhe.status] ?? detalhe.status}</p>
              </div>
              <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Cliente / Solicitante</span>
                  {!detalhe.clienteId && detalhe.solicitanteNome && (
                    <button
                      onClick={() => {
                        setNovoCliente({
                          razaoSocialNome: detalhe.solicitanteNome ?? '',
                          cpfCnpj: detalhe.cpfCnpj ?? '',
                          telefone: detalhe.solicitanteTelefone ?? '',
                          cep: detalhe.cep ?? '',
                          logradouro: detalhe.logradouro ?? '',
                          numero: detalhe.numero ?? '',
                          bairro: detalhe.bairro ?? '',
                          cidade: detalhe.cidade ?? '',
                          estado: detalhe.estado ?? '',
                        });
                        setBuscaCliente(detalhe.solicitanteNome ?? '');
                        setShowNovoCliente(true);
                        setModalAberto(true);
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Plus size={14} /> Cliente não cadastrado
                    </button>
                  )}
                </div>
                <p className="text-gray-900 font-medium mt-0.5">{detalhe.cliente?.razaoSocialNome ?? detalhe.solicitanteNome ?? '—'}</p>
                {detalhe.cliente?.vendedor && (
                  <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 ring-1 ring-violet-200">
                    Vendedor: {detalhe.cliente.vendedor.nome}
                  </span>
                )}
                {detalhe.cpfCnpj && <p className="text-xs text-gray-500 mt-0.5">CPF/CNPJ: {detalhe.cpfCnpj}</p>}
                {detalhe.solicitanteTelefone && <p className="text-xs text-gray-500 mt-0.5">Tel: {detalhe.solicitanteTelefone}</p>}
                {!detalhe.clienteId && detalhe.logradouro && (
                  <p className="text-xs text-gray-500 mt-0.5">{detalhe.logradouro}, {detalhe.numero} — {detalhe.bairro}, {detalhe.cidade}/{detalhe.estado}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Tipo</span>
                {editando ? (
                  <select value={editDetalhe!.tipoEntrega} onChange={e => setEditDetalhe({ ...editDetalhe!, tipoEntrega: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm mt-0.5">
                    <option value="Entrega">Entrega</option>
                    <option value="Retirada">Retirada</option>
                  </select>
                ) : (
                  <p className="text-gray-900 font-medium mt-0.5 capitalize">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${detalhe.tipoEntrega === 'Retirada' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {detalhe.tipoEntrega}
                    </span>
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Pagamento</span>
                {editando ? (
                  <>
                    <select value={editDetalhe!.pagamento} onChange={e => setEditDetalhe({ ...editDetalhe!, pagamento: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm mt-0.5">
                      <option value="">Selecione...</option>
                      <option value="PIX">PIX</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Crédito Loja">Crédito Loja</option>
                      <option value="Fiado">Fiado</option>
                    </select>
                    {editDetalhe!.pagamento === 'Boleto' && (
                      <select
                        value={editDetalhe!.prazoPagamentoDias}
                        onChange={e => setEditDetalhe({ ...editDetalhe!, prazoPagamentoDias: e.target.value === '' ? '' : parseInt(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm mt-2"
                      >
                        <option value="">Prazo (dias) — Selecione...</option>
                        {[7, 14, 21, 30, 45, 60].map(d => <option key={d} value={d}>{d} dias</option>)}
                      </select>
                    )}
                  </>
                ) : (
                  <p className="text-gray-900 font-medium mt-0.5">
                    {detalhe.pagamento || '—'}
                    {detalhe.pagamento === 'Boleto' && detalhe.prazoPagamentoDias && ` · ${detalhe.prazoPagamentoDias} dias`}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Valor Total</span>
                <p className="text-gray-900 font-medium mt-0.5">
                  R$ {(editando
                    ? editDetalhe!.itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0)
                    : detalhe.valorTotal
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Desconto</span>
                {editando ? (
                  <input type="text" value={editDetalhe!.desconto.toFixed(2)} onChange={e => { const v = parseFloat(e.target.value.replace(',', '.')) || 0; setEditDetalhe({ ...editDetalhe!, desconto: v }); }} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm mt-0.5" />
                ) : detalhe.desconto > 0 ? (
                  <p className="text-red-600 font-medium mt-0.5">- R$ {detalhe.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                ) : (
                  <p className="text-gray-500 font-medium mt-0.5">—</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Acréscimo</span>
                {editando ? (
                  <input type="text" value={editDetalhe!.acrescimo.toFixed(2)} onChange={e => { const v = parseFloat(e.target.value.replace(',', '.')) || 0; setEditDetalhe({ ...editDetalhe!, acrescimo: v }); }} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm mt-0.5" />
                ) : detalhe.acrescimo > 0 ? (
                  <p className="text-amber-600 font-medium mt-0.5">+ R$ {detalhe.acrescimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                ) : (
                  <p className="text-gray-500 font-medium mt-0.5">—</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Valor Final</span>
                <p className="text-gray-900 font-bold mt-0.5">
                  R$ {(editando
                    ? (editDetalhe!.itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0) + editDetalhe!.acrescimo - editDetalhe!.desconto)
                    : detalhe.valorFinal
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Peso Total</span>
                <p className="text-gray-900 font-medium mt-0.5">{detalhe.pesoTotal.toFixed(2)} kg</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Data</span>
                <p className="text-gray-900 font-medium mt-0.5">{new Date(detalhe.dataCriacao).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Endereço</span>
                {editando ? (
                  <div className="space-y-2 mt-1">
                    <div className="flex gap-2">
                      <input type="text" value={editDetalhe!.logradouro} onChange={e => setEditDetalhe({ ...editDetalhe!, logradouro: e.target.value })} placeholder="Logradouro" className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm" />
                      <input type="text" value={editDetalhe!.numero} onChange={e => setEditDetalhe({ ...editDetalhe!, numero: e.target.value })} placeholder="Nº" className="w-20 border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm" />
                    </div>
                    <input type="text" value={editDetalhe!.complemento} onChange={e => setEditDetalhe({ ...editDetalhe!, complemento: e.target.value })} placeholder="Complemento" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm" />
                    <div className="flex gap-2">
                      <input type="text" value={editDetalhe!.bairro} onChange={e => setEditDetalhe({ ...editDetalhe!, bairro: e.target.value })} placeholder="Bairro" className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm" />
                      <input type="text" value={editDetalhe!.cidade} onChange={e => setEditDetalhe({ ...editDetalhe!, cidade: e.target.value })} placeholder="Cidade" className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={editDetalhe!.estado} onChange={e => setEditDetalhe({ ...editDetalhe!, estado: e.target.value })} placeholder="UF" maxLength={2} className="w-16 border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm" />
                      <div className="relative flex-1">
                        <input type="text" value={editDetalhe!.cep} onChange={e => setEditDetalhe({ ...editDetalhe!, cep: e.target.value })} onBlur={handleBuscarCEPEdit} placeholder="CEP" className={`w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm ${buscandoCEP === 'edit' ? 'pr-8' : ''}`} />
                        {buscandoCEP === 'edit' && <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                      </div>
                    </div>
                  </div>
                ) : (detalhe.logradouro || detalhe.bairro) ? (
                  <div>
                    <p className="text-gray-900 font-medium mt-0.5">
                      {detalhe.logradouro && `${detalhe.logradouro}, ${detalhe.numero ?? 'S/N'}`}{detalhe.complemento && ` - ${detalhe.complemento}`}
                    </p>
                    <p className="text-xs text-gray-500">{detalhe.bairro && `${detalhe.bairro}, `}{detalhe.cidade && `${detalhe.cidade} - `}{detalhe.estado}{detalhe.cep && `, CEP ${detalhe.cep}`}</p>
                    {detalhe.enderecoConfere !== undefined && (
                      <p className={`text-xs mt-1 ${detalhe.enderecoConfere ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {detalhe.enderecoConfere ? '✓ Endereço confere com cadastro do cliente' : '⚠ Endereço diferente do cadastro do cliente'}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-0.5 text-sm">Nenhum endereço informado</p>
                )}
              </div>
              <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Observação</span>
                {editando ? (
                  <textarea
                    value={editDetalhe!.observacao}
                    onChange={e => setEditDetalhe({ ...editDetalhe!, observacao: e.target.value })}
                    placeholder="Observações sobre o pedido..."
                    rows={3}
                    maxLength={500}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm mt-1 resize-none"
                  />
                ) : detalhe.observacao ? (
                  <p className="text-gray-900 text-sm mt-1 whitespace-pre-wrap">{detalhe.observacao}</p>
                ) : (
                  <p className="text-gray-500 mt-1 text-sm">Nenhuma observação</p>
                )}
              </div>
              {detalhe.itens && detalhe.itens.length > 0 && (
                <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Itens ({detalhe.itens.length})</span>
                  <div className="mt-2 space-y-1">
                    {detalhe.itens.map((item, idx) => (
                      <div key={item.id} className="flex justify-between items-center text-sm gap-2">
                        <span className="min-w-0 flex-1">{item.produto?.nome ?? `Produto #${item.produtoId}`}</span>
                        {editando ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <input type="text" inputMode="decimal" value={(editDetalhe!.itens[idx]?.quantidade ?? item.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} onChange={e => { const itens = [...editDetalhe!.itens]; itens[idx] = { ...itens[idx], quantidade: parseFloat(e.target.value.replace(',', '.')) || 0 }; setEditDetalhe({ ...editDetalhe!, itens }); }} className="w-16 border border-gray-300 rounded-lg p-1 outline-none focus:border-black text-xs text-center" />
                            <span className="text-gray-400">x</span>
                            <input type="text" value={(editDetalhe!.itens[idx]?.precoUnitario ?? item.precoUnitario).toFixed(2)} onChange={e => { const v = parseFloat(e.target.value.replace(',', '.')) || 0; const itens = [...editDetalhe!.itens]; itens[idx] = { ...itens[idx], precoUnitario: v }; setEditDetalhe({ ...editDetalhe!, itens }); }} className="w-20 border border-gray-300 rounded-lg p-1 outline-none focus:border-black text-xs text-right" />
                          </div>
                        ) : (
                          <span className="text-gray-500 shrink-0">
                            {item.quantidade} x R$ {item.precoUnitario.toFixed(2)}
                            {item.separado && ' ✓'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {editando && (
              <button
                onClick={async () => {
                  const e = editDetalhe!;
                  const ok = await pedidoService.atualizarPedido(detalhe.id, {
                    tipoEntrega: e.tipoEntrega,
                    pagamento: e.pagamento,
                    prazoPagamentoDias: e.prazoPagamentoDias === '' ? undefined : e.prazoPagamentoDias,
                    cep: e.cep,
                    logradouro: e.logradouro,
                    numero: e.numero,
                    complemento: e.complemento,
                    bairro: e.bairro,
                    cidade: e.cidade,
                    estado: e.estado,
                    desconto: e.desconto,
                    acrescimo: e.acrescimo,
                    valorTotal: e.itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0),
                    observacao: e.observacao,
                    itens: e.itens,
                  });
                  if (ok) { fecharDetalhe(); await carregar(); }
                }}
                className="w-full mt-4 py-2.5 rounded-xl font-medium text-sm bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Salvar Alterações
              </button>
            )}
            {detalhe.status === 'AguardandoConfirmacao' && (
              <button
                onClick={async () => {
                  if (editDetalhe) {
                    const ok = await pedidoService.atualizarPedido(detalhe.id, {
                      tipoEntrega: editDetalhe.tipoEntrega,
                      pagamento: editDetalhe.pagamento,
                      prazoPagamentoDias: editDetalhe.prazoPagamentoDias === '' ? undefined : editDetalhe.prazoPagamentoDias,
                      cep: editDetalhe.cep,
                      logradouro: editDetalhe.logradouro,
                      numero: editDetalhe.numero,
                      complemento: editDetalhe.complemento,
                      bairro: editDetalhe.bairro,
                      cidade: editDetalhe.cidade,
                      estado: editDetalhe.estado,
                      desconto: editDetalhe.desconto,
                      acrescimo: editDetalhe.acrescimo,
                      valorTotal: editDetalhe.itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0),
                      observacao: editDetalhe.observacao,
                      itens: editDetalhe.itens,
                    });
                    if (!ok) return;
                  }
                  const confirmou = await pedidoService.confirmarPedido(detalhe.id);
                  if (!confirmou) { alert('Erro ao confirmar pedido.'); return; }
                  fecharDetalhe();
                  await carregar();
                }}
                className="w-full mt-2 py-2.5 rounded-xl font-medium text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
              >
                Confirmar Pedido
              </button>
            )}
            {detalhe.tipoEntrega === 'Retirada' && detalhe.status === 'ProntoRetirada' && (
              <button
                onClick={async () => {
                  const ok = await pedidoService.confirmarRetirada(detalhe.id);
                  if (!ok) { alert('Erro ao confirmar retirada.'); return; }
                  fecharDetalhe();
                  await carregar();
                }}
                className="w-full mt-4 py-2.5 rounded-xl font-medium text-sm bg-amber-600 text-white hover:bg-amber-500 transition-colors"
              >
                Confirmar Retirada
              </button>
            )}
            <button
              onClick={async () => {
                if (!window.confirm('Tem certeza que deseja excluir este pedido?')) return;
                const ok = await pedidoService.excluirPedido(detalhe.id);
                if (!ok) { alert('Erro ao excluir pedido.'); return; }
                fecharDetalhe();
                await carregar();
              }}
              className="w-full mt-2 py-2.5 rounded-xl font-medium text-sm bg-red-600 text-white hover:bg-red-500 transition-colors"
            >
              Excluir Pedido
            </button>
          </div>
        </div>
      )}

      {showNovoCliente && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => { setShowNovoCliente(false); setModalAberto(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">Novo Cliente</h2>
              <button onClick={() => { setShowNovoCliente(false); setModalAberto(false); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <p className="text-gray-500 mb-4 text-sm">Preencha os dados para cadastrar o cliente.</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome / Razão Social *</label>
                <input value={novoCliente.razaoSocialNome} onChange={e => setNovoCliente({ ...novoCliente, razaoSocialNome: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="Nome completo ou razão social" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">CPF / CNPJ</label>
                  <input value={novoCliente.cpfCnpj} onChange={e => setNovoCliente({ ...novoCliente, cpfCnpj: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefone</label>
                  <input value={novoCliente.telefone} onChange={e => setNovoCliente({ ...novoCliente, telefone: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">CEP</label>
                  <div className="relative">
                    <input value={novoCliente.cep} onChange={e => setNovoCliente({ ...novoCliente, cep: e.target.value })} onBlur={handleBuscarCEPNovo} className={`w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5 ${buscandoCEP === 'novo' ? 'pr-9' : ''}`} placeholder="00000-000" />
                    {buscandoCEP === 'novo' && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Logradouro</label>
                  <input value={novoCliente.logradouro} onChange={e => setNovoCliente({ ...novoCliente, logradouro: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="Rua, Avenida..." />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Número</label>
                  <input value={novoCliente.numero} onChange={e => setNovoCliente({ ...novoCliente, numero: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="123" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Bairro</label>
                  <input value={novoCliente.bairro} onChange={e => setNovoCliente({ ...novoCliente, bairro: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">UF</label>
                  <input value={novoCliente.estado} onChange={e => setNovoCliente({ ...novoCliente, estado: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="SP" maxLength={2} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Cidade</label>
                <input value={novoCliente.cidade} onChange={e => setNovoCliente({ ...novoCliente, cidade: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setShowNovoCliente(false); setModalAberto(false); }} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={criarCliente} disabled={!novoCliente.razaoSocialNome.trim()} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${novoCliente.razaoSocialNome.trim() ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Cadastrar e Selecionar</button>
            </div>
          </div>
        </div>
      )}

      {showBloqueadoDialog && clienteBloqueadoSelecionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert size={22} className="text-amber-500" /> Cliente Bloqueado
              </h2>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800 font-medium">{clienteBloqueadoSelecionado.razaoSocialNome}</p>
              <p className="text-xs text-amber-600 mt-1">{clienteBloqueadoSelecionado.cpfCnpj}</p>
              <p className="text-xs text-amber-700 mt-3 leading-relaxed">
                Este cliente está bloqueado pelo setor financeiro. Um pedido pode ser criado, mas ficará <strong>pendente de liberação</strong> até que o financeiro aprove.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={cancelarClienteBloqueado} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">
                Cancelar
              </button>
              <button onClick={confirmarClienteBloqueado} className="px-5 py-2.5 bg-amber-600 text-white hover:bg-amber-700 rounded-xl font-medium transition-colors text-sm flex items-center gap-2">
                <ShieldAlert size={14} /> Solicitar Liberação ao Financeiro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
