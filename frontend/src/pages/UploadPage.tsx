import { motion } from "framer-motion";
import { Upload, CheckCircle2, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { analyzeDocument, fetchSeedDocument } from "../api";
import { AnimatedButton } from "../components/ui/AnimatedButton";

// The AnalyzeResponse is available in App context but we can pass it via router state.
// We'll manage the loading steps here.

const LOADING_STEPS = [
  "Detecting Sensitive Information",
  "Building Explainability",
  "Finding Near Misses",
  "Verifying Redactions",
  "Preparing Secure Preview",
  "Trust Analysis Complete"
];

export function UploadPage() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loadingStep, setLoadingStep] = useState(-1);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File | undefined | null) => {
    if (!file) return;
    handleAnalyze(file);
  };

  const handleAnalyze = async (payload: string | File) => {
    setStatus("loading");
    setLoadingStep(0);
    
    // Animate through steps to fake a complex pipeline
    const interval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 600);

    try {
      const result = await analyzeDocument(payload);
      clearInterval(interval);
      setLoadingStep(LOADING_STEPS.length);
      setStatus("success");
      setTimeout(() => {
        navigate("/workspace", { state: { analysisResult: result, originalFile: payload } });
      }, 800);
    } catch (error) {
      clearInterval(interval);
      setStatus("error");
      setErrorMsg(error instanceof Error ? error.message : "Analysis failed");
    }
  };

  const loadDemo = async () => {
    try {
      const seed = await fetchSeedDocument();
      handleAnalyze(seed);
    } catch {
      setStatus("error");
      setErrorMsg("Failed to load demo document.");
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {status === "idle" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Upload Document</h2>
              <p className="text-conseal-text-secondary">Provide a document for deterministic redaction analysis.</p>
            </div>

            <div 
              className={cn(
                "w-full p-16 border border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-500 cursor-pointer backdrop-blur-xl relative overflow-hidden",
                isDragging 
                  ? "border-conseal-primary bg-conseal-primary/10 shadow-[0_0_50px_-12px_rgba(139,92,246,0.5)]" 
                  : "border-white/20 bg-white/[0.02] hover:border-conseal-primary/50 hover:bg-white/[0.04]"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                handleFileUpload(file);
              }}
            >
              {isDragging && (
                 <motion.div 
                   layoutId="drop-glow"
                   className="absolute inset-0 bg-conseal-primary/20 blur-[100px] pointer-events-none"
                 />
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />
              <motion.div
                animate={isDragging ? { y: -10, scale: 1.1 } : { y: 0, scale: 1 }}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-2xl pointer-events-none transition-colors duration-500 z-10",
                  isDragging ? "bg-conseal-primary text-white" : "bg-black/40 text-conseal-text-secondary border border-white/5"
                )}
              >
                <Upload className="w-8 h-8" />
              </motion.div>
              <p className="text-xl font-bold text-white mb-2 pointer-events-none z-10">Drag & drop your document here</p>
              <p className="text-sm text-conseal-text-secondary mb-8 pointer-events-none z-10">or click to browse (PDF, DOCX, TXT)</p>
              
              <div className="z-10">
              <AnimatedButton 
                onClick={(e) => {
                  e.stopPropagation();
                  loadDemo();
                }} 
                className="px-6 py-2"
              >
                Use Demo Document
              </AnimatedButton>
              </div>
            </div>
          </motion.div>
        )}

        {status === "loading" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-12 bg-conseal-card border border-conseal-border rounded-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-8">Analyzing Document</h2>
            <div className="w-full max-w-sm space-y-5">
              {LOADING_STEPS.map((step, index) => {
                const isActive = index === loadingStep;
                const isPast = index < loadingStep;
                
                return (
                  <div key={step} className="flex items-center gap-4">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      {isPast ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                          <CheckCircle2 className="w-6 h-6 text-conseal-success" />
                        </motion.div>
                      ) : isActive ? (
                        <motion.div 
                          animate={{ rotate: 360 }} 
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-5 h-5 border-2 border-conseal-primary border-t-transparent rounded-full"
                        />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-conseal-border" />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors duration-300",
                      isPast ? "text-white" : isActive ? "text-conseal-primary" : "text-conseal-text-secondary"
                    )}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 w-full max-w-sm h-1 bg-white/10 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                className="h-full bg-gradient-to-r from-conseal-primary to-conseal-success rounded-full"
                animate={{ width: `${Math.max(5, (loadingStep / (LOADING_STEPS.length - 1)) * 100)}%` }}
                transition={{ type: "spring", stiffness: 50 }}
              />
            </div>
            <p className="mt-4 text-xs text-conseal-text-secondary text-center font-medium">Estimated time: 2-3 seconds</p>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 bg-conseal-card border border-conseal-success/50 rounded-2xl"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-20 h-20 bg-conseal-success/10 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-conseal-success" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Analysis Complete</h2>
            <p className="text-conseal-text-secondary">Preparing workspace...</p>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-12 bg-conseal-card border border-conseal-danger rounded-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-conseal-danger" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
            <p className="text-sm text-conseal-danger mb-6">{errorMsg}</p>
            <AnimatedButton onClick={() => setStatus("idle")} variant="secondary">
              Try Again
            </AnimatedButton>
          </motion.div>
        )}
      </div>
    </div>
  );
}
