import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="h-screen w-full flex flex-col bg-conseal-bg text-conseal-text font-sans overflow-hidden selection:bg-conseal-primary/30">
      <Navbar />
      <div className="flex-1 overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
}
