import { Shield, Upload, Check } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";

export function Navbar() {
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith("/workspace");
  const isExport = location.pathname === "/export";

  const steps = [
    { label: "Upload", path: "/upload", done: isWorkspace || isExport },
    { label: "Analyze", path: "/workspace", done: isExport },
    { label: "Export", path: "/export", done: false },
  ];

  return (
    <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-[#0B0D17]/90 backdrop-blur-xl z-50">
      <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <div className="w-7 h-7 bg-conseal-primary/10 rounded-lg flex items-center justify-center border border-conseal-primary/20">
          <Shield className="w-3.5 h-3.5 text-conseal-primary" />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">Conseal Trust Center</span>
      </Link>

      {/* Step breadcrumb */}
      <nav className="hidden md:flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1">
            {i > 0 && <div className="w-8 h-px bg-white/10" />}
            <Link
              to={step.path}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                location.pathname.startsWith(step.path) && !isExport || (step.path === "/export" && isExport)
                  ? "bg-white/10 text-white"
                  : step.done
                    ? "text-conseal-success hover:bg-white/5"
                    : "text-white/30 hover:text-white/50"
              )}
            >
              {step.done ? (
                <span className="w-4 h-4 rounded-full bg-conseal-success/20 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-conseal-success" />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[8px] text-white/30 font-bold">
                  {i + 1}
                </span>
              )}
              {step.label}
            </Link>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {!isWorkspace && !isExport && (
          <Link
            to="/upload"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/70 border border-white/10 hover:bg-white/5 hover:text-white transition-all"
          >
            <Upload className="w-3 h-3" />
            Analyze
          </Link>
        )}
      </div>
    </header>
  );
}
