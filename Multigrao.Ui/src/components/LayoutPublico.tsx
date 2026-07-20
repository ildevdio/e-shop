import { Outlet } from 'react-router-dom';

export default function LayoutPublico() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="flex flex-1 flex-col h-full overflow-hidden min-w-0">
        <main className="relative flex-1 overflow-hidden">
          <div className="relative z-10 h-full overflow-auto p-4 pb-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
