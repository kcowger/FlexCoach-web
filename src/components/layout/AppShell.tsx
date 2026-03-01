import { Outlet } from 'react-router-dom';
import TabBar from '@/components/layout/TabBar';

export default function AppShell() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
