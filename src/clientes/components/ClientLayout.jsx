import React from "react";
import { Outlet } from "react-router-dom";
import { ClientSidebar } from "./ClientSidebar";
import { ClientNavbar } from "./ClientNavbar";
import { useAppStore } from "../../app/store";

export const ClientLayout = () => {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-sand">
      <ClientNavbar />
      <ClientSidebar />
      <main
        className={`
          min-h-screen pt-16 transition-all duration-300
          ${sidebarOpen ? "lg:ml-64" : "lg:ml-64"}
        `}
      >
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
