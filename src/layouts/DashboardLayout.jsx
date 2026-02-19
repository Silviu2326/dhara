import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { TherapistSidebar } from '../components/TherapistSidebar';
import { useAppStore } from '../app/store';

export const DashboardLayout = () => {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-sand">
      <Navbar />
      <TherapistSidebar />
      <main 
        className={`
          min-h-screen pt-16 transition-all duration-300
          lg:ml-64
        `}
      >
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};