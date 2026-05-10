import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[220px] flex flex-col min-w-0">
        <Topbar />
        <div className="flex-1 p-8 overflow-y-auto min-w-[1060px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
