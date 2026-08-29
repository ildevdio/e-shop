import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import LayoutPublico from './components/LayoutPublico';
import WakeUpBanner from './components/WakeUpBanner';
import Login from './pages/Login';
import LoginEmpresa from './pages/LoginEmpresa';
import Dashboard from './pages/Dashboard';
import Empresas from './pages/Empresas';
import NovaEmpresa from './pages/NovaEmpresa';
import Configuracoes from './pages/Configuracoes';
import ConfiguracoesBots from './pages/ConfiguracoesBots';
import Chat from './pages/Chat';
import Empresa from './pages/Empresa';
import EmpresaAvisos from './pages/EmpresaAvisos';
import EmpresaEnquetes from './pages/EmpresaEnquetes';
import Comercial from './pages/Comercial';
import ComercialPedidos from './pages/ComercialPedidos';
import ComercialClientes from './pages/ComercialClientes';
import ComercialContatos from './pages/ComercialContatos';
import ComercialListaAtendimentos from './pages/ComercialListaAtendimentos';
import ComercialPromocoes from './pages/ComercialPromocoes';
import ComercialCupons from './pages/ComercialCupons';
import Relatorios from './pages/Relatorios';
import Catalogo from './pages/Catalogo';
import Tabela from './pages/Tabela';
import Separacao from './pages/Separacao';
import Logistica from './pages/Logistica';
import Entregas from './pages/Entregas';
import Conferencia from './pages/Conferencia';
import Financeiro from './pages/Financeiro';
import Links from './pages/Links';
import RedirectLink from './pages/RedirectLink';
import { useAuthStore } from './store/authStore';
import { useSistemaStore, CONFIG_PADRAO } from './store/sistemaStore';
import { isShopDomain } from './services/tenantSetup';
import { midiaUrl } from './utils/imageUrl';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const { slug } = useParams();
  if (!token) {
    if (isShopDomain()) return <Navigate to="/login" replace />;
    return <Navigate to={`/${slug ?? ''}/login`} replace />;
  }
  return <>{children}</>;
}

function TenantLoginRoute() {
  const { slug } = useParams();
  if (slug === 'login') return <Navigate to="/" replace />;
  return <Login />;
}

function HomeRoute() {
  const { slug } = useParams();
  if (isShopDomain()) return <Navigate to="/login" replace />;
  return <Navigate to={slug ? `/${slug}` : '/multigraos'} replace />;
}

function IndexRoute() {
  const { slug } = useParams();
  if (slug === 'focus') return <Navigate to={`/focus/empresas`} replace />;
  return <Dashboard />;
}

function CommerceRoute({ children }: { children: React.ReactNode }) {
  const { slug } = useParams();
  if (slug === 'focus') return <Navigate to={`/${slug ?? ''}`} replace />;
  return <>{children}</>;
}

function setMeta(selector: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    const attr = selector.startsWith('meta[property') ? 'property' : 'name';
    const match = selector.match(/(?:property|name)="([^"]+)"/);
    if (match) el.setAttribute(attr, match[1]);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function App() {
  const nomeEmpresa = useSistemaStore((state) => state.config.nomeEmpresa);
  const slogan = useSistemaStore((state) => state.config.slogan);
  const logoUrl = useSistemaStore((state) => state.config.logoUrl);

  const titulo = `${nomeEmpresa} - Sistema de Gestão`;
  const descricao = slogan || nomeEmpresa;

  useEffect(() => {
    document.title = titulo;
    setMeta('meta[property="og:title"]', nomeEmpresa || '');
    setMeta('meta[name="description"]', descricao || '');
    setMeta('meta[property="og:description"]', descricao || '');
  }, [titulo, descricao, nomeEmpresa]);

  useEffect(() => {
    const url = logoUrl || CONFIG_PADRAO.logoUrl;
    const href = midiaUrl(url);
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (link && href) link.href = href;
    if (href) {
      const absoluto = /^https?:\/\//i.test(href) ? href : new URL(href, window.location.origin).href;
      setMeta('meta[property="og:image"]', absoluto);
    }
  }, [logoUrl]);

  return (
    <BrowserRouter>
      <WakeUpBanner />
      <Routes>
        <Route path="/" element={<HomeRoute />} />

        <Route path="/login" element={<LoginEmpresa />} />

        <Route path="/:slug/login" element={<TenantLoginRoute />} />
        
        <Route path="/:slug" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<IndexRoute />} />
          <Route path="empresas" element={<Empresas />} />
          <Route path="empresas/nova" element={<NovaEmpresa />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="configuracoes/bots" element={<ConfiguracoesBots />} />
          <Route path="chat" element={<Chat />} />

          <Route path="empresa" element={<Empresa />} />
          <Route path="empresa/avisos" element={<EmpresaAvisos />} />
          <Route path="empresa/enquetes" element={<EmpresaEnquetes />} />

          <Route path="comercial" element={<Comercial />} />
          <Route path="comercial/pedidos" element={<ComercialPedidos />} />
          <Route path="comercial/clientes" element={<ComercialClientes />} />
          <Route path="comercial/contatos" element={<ComercialContatos />} />
          <Route path="comercial/lista-atendimentos" element={<ComercialListaAtendimentos />} />
          <Route path="comercial/promocoes" element={<ComercialPromocoes />} />
          <Route path="comercial/cupons" element={<ComercialCupons />} />

          <Route path="relatorios" element={<Relatorios />} />

          <Route path="catalogo" element={<Catalogo />} />
          <Route path="separacao" element={<Separacao />} />

          <Route path="logistica" element={<Logistica />} />

          <Route path="conferencia" element={<Conferencia />} />
          <Route path="entregas" element={<Entregas />} />
          <Route path="financeiro" element={<Financeiro />} />
        </Route>

        <Route path="/:slug/commerce" element={<CommerceRoute><LayoutPublico /></CommerceRoute>}>
          <Route index element={<Tabela />} />
        </Route>
        
        <Route path="/:slug/links" element={<CommerceRoute><Links /></CommerceRoute>} />
        <Route path="/:slug/r/:alias" element={<CommerceRoute><RedirectLink /></CommerceRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
