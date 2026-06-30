import React, { useState, useCallback } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/utils";
import type { Span, AnalyzeResponse } from "../types";

import { fetchPreview } from "../api";
import type { PreviewResponse } from "../api";

import DocumentViewer from "../components/DocumentViewer";
import TrustSummaryPanel from "../components/TrustSummaryPanel";
import ExplanationPanel from "../components/ExplanationPanel";
import NearMissPanel from "../components/NearMissPanel";
import NeedsReviewPanel from "../components/NeedsReviewPanel";
import VerificationPanel from "../components/VerificationPanel";
import { ReviewProvider, useReviewContext } from "../context/ReviewContext";

type ActiveTab = "summary" | "entity" | "nearMisses" | "needsReview" | "verification";

function WorkspaceContent({ analysisResult, originalFile }: { analysisResult: AnalyzeResponse; originalFile: File | null }) {
  const navigate = useNavigate();
  const { spans } = useReviewContext();

  const [activeTab, setActiveTab] = useState<ActiveTab>("summary");
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(null);
  const [redactedPreviewData, setRedactedPreviewData] = useState<PreviewResponse | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const originalFileUrl = React.useMemo(() => {
    if (originalFile instanceof File) {
      return URL.createObjectURL(originalFile);
    }
    return originalFile;
  }, [originalFile]);

  const originalFileType = analysisResult.fileType || originalFile?.name?.split('.').pop()?.toLowerCase() || 'pdf';

  // Debounced preview generator – re-runs whenever spans change (i.e., user overrides)
  React.useEffect(() => {
    if (!originalFile) return;
    let active = true;
    const generate = async () => {
      setIsGeneratingPreview(true);
      try {
        const res = await fetchPreview(originalFile, spans);
        if (active) setRedactedPreviewData(res);
      } catch (err) {
        console.error("Preview generation failed:", err);
      } finally {
        if (active) setIsGeneratingPreview(false);
      }
    };
    const t = setTimeout(generate, 600);
    return () => { active = false; clearTimeout(t); };
  }, [originalFile, spans]);

  const handleSpanClick = useCallback((span: Span) => {
    setSelectedSpan(span);
    setActiveTab("entity");
  }, []);

  const handleExport = useCallback(() => {
    navigate("/export", { state: { analysisResult: { ...analysisResult, spans }, originalFile } });
  }, [navigate, analysisResult, spans, originalFile]);

  const needsReviewCount = spans.filter(s => s.needsReview).length;
  const nearMissCount = spans.filter(s => s.status === "nearMiss").length;

  type TabDef = { id: ActiveTab; icon: React.ReactNode; label: string; badge?: number };
  const tabs: TabDef[] = [
    { id: "summary", icon: <ShieldCheck className="w-4 h-4" />, label: "Trust Summary" },
    { id: "entity", icon: <FileText className="w-4 h-4" />, label: "Entity Detail" },
    { id: "nearMisses", icon: <Eye className="w-4 h-4" />, label: "Near Misses", badge: nearMissCount },
    { id: "needsReview", icon: <AlertTriangle className="w-4 h-4" />, label: "Needs Review", badge: needsReviewCount },
    { id: "verification", icon: <CheckCircle2 className="w-4 h-4" />, label: "Verification" },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0B0D17]">

      {/* ── Left Sidebar ─────────────────────────────────── */}
      <aside className="w-56 border-r border-white/10 bg-black/20 flex flex-col pt-5 px-3 gap-1 z-10 shrink-0 backdrop-blur-xl">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 mb-2">
          Trust Center
        </p>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={active}
              className={cn(
                "relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                active
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70"
              )}
            >
              <div className="flex items-center gap-2.5">
                {tab.icon}
                {tab.label}
              </div>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                  active ? "bg-white/20 text-white" : "bg-white/10 text-white/50"
                )}>
                  {tab.badge}
                </span>
              )}
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 rounded-xl ring-1 ring-white/20 pointer-events-none"
                />
              )}
            </button>
          );
        })}
      </aside>

      {/* ── Document Viewers ───────────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex gap-3 p-3 min-w-0">
        {/* Original */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {originalFileUrl ? (
            <DocumentViewer
              fileType={originalFileType}
              title="Original"
              url={originalFileUrl}
              textContent={analysisResult.document}
              spans={spans}
              onSpanClick={handleSpanClick}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white/[0.02] border border-white/10 rounded-xl">
              <span className="text-white/40 text-sm">No original file</span>
            </div>
          )}
        </div>

        {/* Redacted */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          {redactedPreviewData ? (
            <DocumentViewer
              fileType={redactedPreviewData.fileType}
              title="Redacted"
              url={redactedPreviewData.previewUrl}
              downloadUrl={redactedPreviewData.previewUrl}
              textContent={redactedPreviewData.redactedText}
              spans={spans}
              onSpanClick={handleSpanClick}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white/[0.02] border border-white/10 rounded-xl gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-6 h-6 border-2 border-conseal-primary border-t-transparent rounded-full"
              />
              <span className="text-white/40 text-sm">Generating redacted preview…</span>
            </div>
          )}
          {isGeneratingPreview && redactedPreviewData && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-7 h-7 border-2 border-conseal-primary border-t-transparent rounded-full"
              />
            </div>
          )}
        </div>
      </main>

      {/* ── Right Panel ──────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.aside
          key={activeTab}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="w-[360px] border-l border-white/10 bg-[#0e1017]/90 backdrop-blur-xl shrink-0 overflow-hidden flex flex-col shadow-2xl z-20"
        >
          {activeTab === "summary" && (
            <TrustSummaryPanel spans={spans} onExport={handleExport} />
          )}
          {activeTab === "entity" && (
            <ExplanationPanel span={selectedSpan} onClose={() => setSelectedSpan(null)} />
          )}
          {activeTab === "nearMisses" && (
            <NearMissPanel
              spans={spans.filter(s => s.status === "nearMiss")}
              onSpanSelect={(span) => { handleSpanClick(span); }}
              selectedSpanId={selectedSpan?.id}
            />
          )}
          {activeTab === "needsReview" && (
            <NeedsReviewPanel
              spans={spans.filter(s => s.needsReview)}
              onSpanSelect={(span) => { handleSpanClick(span); }}
              selectedSpanId={selectedSpan?.id}
            />
          )}
          {activeTab === "verification" && (
            <VerificationPanel
              documentText={analysisResult.document}
              spans={spans}
              onExport={handleExport}
            />
          )}
        </motion.aside>
      </AnimatePresence>
    </div>
  );
}

export function WorkspacePage() {
  const location = useLocation();
  const analysisResult = location.state?.analysisResult;
  const originalFile = location.state?.originalFile ?? null;

  if (!analysisResult) {
    return <Navigate to="/upload" replace />;
  }

  return (
    <ReviewProvider initialSpans={analysisResult.spans}>
      <WorkspaceContent analysisResult={analysisResult} originalFile={originalFile} />
    </ReviewProvider>
  );
}
