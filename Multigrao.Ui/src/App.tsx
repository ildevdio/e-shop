import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LayoutPublico from './components/LayoutPublico';
import WakeUpBanner from './components/WakeUpBanner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Configuracoes from './pages/Configuracoes';
import Chat from './pages/Chat';
import Empresa from './pages/Empresa';
import EmpresaAvisos from './pages/EmpresaAvisos';
import EmpresaEnquetes from './pages/EmpresaEnquetes';
import Comercial from './pages/Comercial';
import ComercialPedidos from './pages/ComercialPedidos';
import ComercialClientes from './pages/ComercialClientes';
import ComercialContatos from './pages/ComercialContatos';
import ComercialListaAtendimentos from './pages/ComercialListaAtendimentos';
import Catalogo from './pages/Catalogo';
import Tabela from './pages/Tabela';
import Separacao from './pages/Separacao';
import Logistica from './pages/Logistica';
import Entregas from './pages/Entregas';
import Conferencia from './pages/Conferencia';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <WakeUpBanner />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="chat" element={<Chat />} />

          <Route path="empresa" element={<Empresa />} />
          <Route path="empresa/avisos" element={<EmpresaAvisos />} />
          <Route path="empresa/enquetes" element={<EmpresaEnquetes />} />

          <Route path="comercial" element={<Comercial />} />
          <Route path="comercial/pedidos" element={<ComercialPedidos />} />
          <Route path="comercial/clientes" element={<ComercialClientes />} />
          <Route path="comercial/contatos" element={<ComercialContatos />} />
          <Route path="comercial/lista-atendimentos" element={<ComercialListaAtendimentos />} />

          <Route path="catalogo" element={<Catalogo />} />
          <Route path="separacao" element={<Separacao />} />

          <Route path="logistica" element={<Logistica />} />

          <Route path="conferencia" element={<Conferencia />} />
          <Route path="entregas" element={<Entregas />} />
        </Route>

        <Route path="/tabela" element={<LayoutPublico />}>
          <Route index element={<Tabela />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
