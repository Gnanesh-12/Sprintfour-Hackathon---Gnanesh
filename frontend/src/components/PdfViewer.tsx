import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

// Setup worker from unpkg CDN — avoids local worker bundle issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string | File;
  title: string;
}

/**
 * PdfViewer — embeds a PDF using react-pdf / pdfjs.
 *
 * When `url` is a remote HTTP string (e.g. http://localhost:8000/exports/...)
 * we fetch it as an ArrayBuffer first so pdfjs gets the raw bytes instead of
 * making a cross-origin fetch itself (which can fail due to missing CORS
 * headers on FastAPI's StaticFiles mount).
 */
export default function PdfViewer({ url, title }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  // Resolved file — either the original File/blob-url or a fetched ArrayBuffer
  const [file, setFile] = useState<string | File | { data: ArrayBuffer } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setNumPages(null);
    setPageNumber(1);
    setLoadError(null);

    if (url instanceof File) {
      setFile(url);
      return;
    }

    // Remote URL — fetch bytes to sidestep pdfjs CORS fetch
    let cancelled = false;
    const controller = new AbortController();

    const fetchPdf = async () => {
      try {
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.arrayBuffer();
        if (!cancelled) setFile({ data });
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg !== 'AbortError') setLoadError(msg);
        }
      }
    };

    fetchPdf();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const zoomIn  = () => setScale(s => Math.min(s + 0.2, 3.0));
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
  const prevPage = () => setPageNumber(p => Math.max(p - 1, 1));
  const nextPage = () => setPageNumber(p => Math.min(p + 1, numPages || 1));

  return (
    <div className="flex flex-col h-full bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden shadow-xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-black/20 shrink-0">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">{title}</h3>
        <div className="flex items-center gap-1">
          <button onClick={zoomOut} title="Zoom out" className="p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono w-10 text-center text-white/40">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} title="Zoom in" className="p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* PDF canvas */}
      <div className="flex-1 overflow-auto bg-[#1a1a1a] flex justify-center items-start p-4 relative" style={{ minHeight: 0 }}>
        {loadError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-400">
            <AlertCircle className="w-8 h-8 opacity-60" />
            <p className="text-sm font-medium">Failed to load PDF</p>
            <p className="text-xs text-white/30 max-w-[200px] text-center">{loadError}</p>
          </div>
        ) : !file ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-conseal-primary border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) => setLoadError(err.message)}
            loading={
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-conseal-primary border-t-transparent rounded-full"
                />
              </div>
            }
          >
            {numPages && (
              <Page
                pageNumber={pageNumber}
                scale={scale}
                className="shadow-2xl"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            )}
          </Document>
        )}
      </div>

      {/* Pagination */}
      {numPages && numPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-2 border-t border-white/10 bg-black/20 shrink-0">
          <button onClick={prevPage} disabled={pageNumber <= 1} className="p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-white/40 font-medium">
            {pageNumber} / {numPages}
          </span>
          <button onClick={nextPage} disabled={pageNumber >= numPages} className="p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
