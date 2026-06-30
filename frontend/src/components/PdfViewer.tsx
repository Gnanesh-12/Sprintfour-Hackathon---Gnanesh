import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { Span } from '../types';

// Setup worker from unpkg CDN — avoids local worker bundle issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string | File;
  title: string;
  spans?: Span[];
  onSpanClick?: (span: Span) => void;
}

/**
 * PdfViewer — embeds a PDF using react-pdf / pdfjs.
 */
export default function PdfViewer({ url, title, spans, onSpanClick }: PdfViewerProps) {
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

  const zoomIn = () => setScale(s => Math.min(s + 0.2, 3.0));
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
  const prevPage = () => setPageNumber(p => Math.max(p - 1, 1));
  const nextPage = () => setPageNumber(p => Math.min(p + 1, numPages || 1));

  const textRenderer = useCallback(
    ({ str, itemIndex }: { str: string; itemIndex: number }) => {
      if (!spans || spans.length === 0 || !onSpanClick) return str;
      if (typeof str !== 'string' || !str.trim()) return str;

      let highlightedStr: (string | React.ReactNode)[] = [str];
      const normStr = str.replace(/\s+/g, ' ').trim().toLowerCase();

      // First check if any span is a substring of this str (the split logic)
      spans.forEach((span) => {
        if (!span.text) return;
        const newHighlightedStr: (string | React.ReactNode)[] = [];

        highlightedStr.forEach((part) => {
          if (typeof part === 'string') {
            const escapedSpan = span.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedSpan})`, 'gi');
            const pieces = part.split(regex);

            if (pieces.length > 1) {
              pieces.forEach((piece) => {
                if (piece.toLowerCase() === span.text.toLowerCase()) {
                  newHighlightedStr.push(
                    <mark
                      key={`${span.id}-${itemIndex}-${Math.random()}`}
                      className="bg-conseal-primary/30 text-transparent cursor-pointer relative z-10 hover:bg-conseal-primary/50 transition-colors pointer-events-auto rounded-[2px]"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSpanClick(span);
                      }}
                      title={`Click to view details for ${span.type}`}
                      style={{ color: 'transparent' }}
                    >
                      {piece}
                    </mark>
                  );
                } else if (piece) {
                  newHighlightedStr.push(piece);
                }
              });
            } else {
              newHighlightedStr.push(part);
            }
          } else {
            newHighlightedStr.push(part);
          }
        });
        highlightedStr = newHighlightedStr;
      });

      // If we didn't split anything (meaning no span was fully inside this str),
      // let's check if this str is a chunk OF a span.
      if (highlightedStr.length === 1 && typeof highlightedStr[0] === 'string') {
        if (normStr.length >= 3) {
          const matchedSpan = spans.find(span => {
            if (!span.text) return false;
            const normSpan = span.text.replace(/\s+/g, ' ').trim().toLowerCase();
            return normSpan.includes(normStr) || normStr.includes(normSpan);
          });
          if (matchedSpan) {
            return (
              <mark
                className="bg-conseal-primary/30 text-transparent cursor-pointer relative z-10 hover:bg-conseal-primary/50 transition-colors pointer-events-auto rounded-[2px]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSpanClick(matchedSpan);
                }}
                title={`Click to view details for ${matchedSpan.type}`}
                style={{ color: 'transparent' }}
              >
                {str}
              </mark>
            );
          }
        }
      }

      // Instead of a fragment, use a span. Some versions of react-pdf clone the result or expect a true element.
      return <span className="react-pdf-text-highlight-wrapper">{highlightedStr}</span>;
    },
    [spans, onSpanClick]
  );

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
                renderTextLayer={true}
                renderAnnotationLayer={false}
                customTextRenderer={textRenderer as any}
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
