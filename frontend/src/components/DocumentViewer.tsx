import { Download, FileText } from "lucide-react";
import PdfViewer from "./PdfViewer";
import { AnimatedButton } from "./ui/AnimatedButton";

interface DocumentViewerProps {
  fileType: string;
  title: string;
  url?: string | File | null;
  textContent?: string;
  downloadUrl?: string;
}

export default function DocumentViewer({
  fileType,
  title,
  url,
  textContent,
  downloadUrl,
}: DocumentViewerProps) {
  if (fileType === "pdf") {
    if (!url) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-white/[0.02] border border-white/10 rounded-xl gap-3 h-full">
          <span className="text-white/40 text-sm">No PDF available</span>
        </div>
      );
    }
    return <PdfViewer url={url} title={title} />;
  }

  if (fileType === "txt") {
    return (
      <div className="flex flex-col h-full bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-black/20 shrink-0">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">{title} (TXT)</h3>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-[#1a1a1a]">
          {textContent ? (
            <pre className="text-white/80 whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {textContent}
            </pre>
          ) : (
             <div className="flex items-center justify-center h-full text-white/40 text-sm">
               Loading text...
             </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback for DOCX or other formats that can't be rendered in the browser natively.
  return (
    <div className="flex flex-col h-full bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-black/20 shrink-0">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">{title} ({fileType.toUpperCase()})</h3>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#1a1a1a]">
        <FileText className="w-12 h-12 text-white/20 mb-4" />
        <h4 className="text-lg font-semibold text-white mb-2">Preview Not Available</h4>
        <p className="text-sm text-white/50 mb-6 max-w-sm leading-relaxed">
          {fileType.toUpperCase()} files cannot be previewed directly in the browser.
          {downloadUrl
            ? " You can download the file to view the redactions."
            : " This document will be processed and you can download the redacted version."}
        </p>
        
        {downloadUrl && (
          <AnimatedButton onClick={() => window.open(downloadUrl, "_blank")} className="flex items-center gap-2 px-6 py-2.5">
            <Download className="w-4 h-4" />
            Download {title}
          </AnimatedButton>
        )}
      </div>
    </div>
  );
}
