import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const { role, setores } = useAuthStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f5f4f0]">
      {/* Sidebar — renders hamburger button + floating dropdown (fixed positioned) */}
      <Sidebar role={role} setores={setores} />

      {/* Main Content Area — full width */}
      <div className="flex-1 flex flex-col h-full overflow-hidden m-2 sm:m-3 lg:m-4 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-black/5 bg-[#f5f4f0]">
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
