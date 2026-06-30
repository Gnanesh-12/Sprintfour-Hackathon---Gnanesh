import { motion } from "framer-motion";
import { CheckCircle2, Download, RefreshCw, FileCheck } from "lucide-react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { AnimatedButton } from "../components/ui/AnimatedButton";
import { AnimatedCard } from "../components/ui/AnimatedCard";
import type { AnalyzeResponse } from "../types";
import { exportDocument } from "../api";
import type { ExportResponse } from "../api";
import { useEffect, useState } from "react";

export function ExportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const analysisResult = location.state?.analysisResult as AnalyzeResponse | undefined;
  const originalFile = location.state?.originalFile as string | File | undefined;

  const [exportData, setExportData] = useState<ExportResponse | null>(null);
  const [isExporting, setIsExporting] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!analysisResult || !originalFile) return;
    
    exportDocument(originalFile, analysisResult.spans)
      .then((data) => {
        setExportData(data);
        setIsExporting(false);
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setIsExporting(false);
      });
  }, [analysisResult, originalFile]);

  if (!analysisResult) {
    return <Navigate to="/upload" replace />;
  }

  const handleDownload = () => {
    if (!exportData) return;
    
    // In a real app we'd fetch the URL as a blob or use a direct <a> link
    // Because we have the absolute URL we can just create an anchor and click it
    const a = document.createElement("a");
    a.href = exportData.downloadUrl;
    // Extract filename from URL or use a generic one with correct extension
    const ext = exportData.fileType || "txt";
    a.download = `conseal-safe-document.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-conseal-success/10 rounded-full flex items-center justify-center mb-8 relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, bounce: 0.5 }}
            >
              <FileCheck className="w-12 h-12 text-conseal-success" />
            </motion.div>
            <motion.div
              className="absolute -bottom-2 -right-2 bg-conseal-card rounded-full p-1 border-2 border-conseal-bg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.6 }}
            >
              <CheckCircle2 className="w-6 h-6 text-conseal-success fill-conseal-success text-white" />
            </motion.div>
          </div>
          
          {isExporting ? (
            <>
              <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Generating Export...</h1>
              <p className="text-xl text-conseal-text-secondary mb-12">Applying redactions and preserving original formatting.</p>
            </>
          ) : errorMsg ? (
            <>
              <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Export Failed</h1>
              <p className="text-xl text-conseal-danger mb-12">{errorMsg}</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Document Ready</h1>
              <p className="text-xl text-conseal-text-secondary mb-2">
                Verification {exportData?.verificationStatus === "passed" ? "Passed" : "Failed"}. Your document is safe to share.
              </p>
              <p className="text-sm font-medium text-conseal-primary mb-12 uppercase tracking-wide">
                Format: {exportData?.fileType}
              </p>
            </>
          )}

          <AnimatedCard className="w-full max-w-md p-8 flex flex-col gap-6 mb-8 text-center bg-conseal-success/5 border-conseal-success/20">
            <div className="space-y-4">
              <AnimatedButton 
                onClick={handleDownload}
                disabled={isExporting || !!errorMsg}
                className="w-full py-3.5 text-base font-semibold shadow-lg shadow-conseal-primary/20"
              >
                <Download className="w-5 h-5" />
                Download Safe Document
              </AnimatedButton>
              
              <AnimatedButton 
                variant="ghost" 
                onClick={() => navigate("/upload")}
                className="w-full py-3"
              >
                <RefreshCw className="w-4 h-4" />
                Analyze Another
              </AnimatedButton>
            </div>
          </AnimatedCard>

        </motion.div>
      </div>
    </div>
  );
}
