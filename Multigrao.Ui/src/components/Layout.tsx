import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import FloatingProducts from './FloatingProducts';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const { role, setores, usuarioId } = useAuthStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar role={role} setores={setores} usuarioId={usuarioId} />

      <div className="flex flex-1 flex-col h-full overflow-hidden min-w-0 ml-3">
        <Topbar />

        <main className="relative flex-1 overflow-hidden">
          <FloatingProducts className="-z-10" />
          <div className="relative h-full overflow-auto p-4 pb-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
