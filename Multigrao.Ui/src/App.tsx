import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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
import Separacao from './pages/Separacao';
import Logistica from './pages/Logistica';
import LogisticaRoteirizacao from './pages/LogisticaRoteirizacao';
import LogisticaVeiculos from './pages/LogisticaVeiculos';
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

          <Route path="separacao" element={<Separacao />} />

          <Route path="logistica" element={<Logistica />} />
          <Route path="logistica/roteirizacao" element={<LogisticaRoteirizacao />} />
          <Route path="logistica/veiculos" element={<LogisticaVeiculos />} />

          <Route path="conferencia" element={<Conferencia />} />
          <Route path="entregas" element={<Entregas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
