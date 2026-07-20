import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import FloatingProducts from './FloatingProducts';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export default function Layout() {
  const { role, setores, usuarioId } = useAuthStore();
  const { modalAberto } = useUiStore();
  const blurCls = modalAberto ? 'brightness-[0.4] saturate-[0.5] pointer-events-none' : '';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar role={role} setores={setores} usuarioId={usuarioId} className={modalAberto ? blurCls : ''} />

      <div className="flex flex-1 flex-col h-full overflow-hidden min-w-0 ml-3">
        <Topbar className={modalAberto ? blurCls : ''} />

        <main className="relative flex-1 overflow-hidden">
          <FloatingProducts className="z-0" />
          <div className="relative z-10 h-full overflow-auto p-4 pb-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
