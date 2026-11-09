import React, { useState, useRef, useEffect } from 'react';
import { ImageQueueItem } from '../types';
import { formatBytes, calculatePrintDimensions } from '../utils/upscaleMath';
import { downloadImageBlob } from '../utils/downloadHelper';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  SplitSquareVertical,
  Columns,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface SplitComparisonModalProps {
  item: ImageQueueItem;
  onClose: () => void;
}

export const SplitComparisonModal: React.FC<SplitComparisonModalProps> = ({ item, onClose }) => {
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'toggle'>('side-by-side');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showOriginalInToggle, setShowOriginalInToggle] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  if (!item.result) return null;

  const result = item.result;
  const printDim = calculatePrintDimensions(result.newWidth, result.newHeight, result.dpi);
  const upscaledImageUrl = `${result.downloadUrl}?inline=true`;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    updateSlider(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updateSlider(e.clientX);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Image Inspection & Preview</span>
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-black text-white">
                {result.scaleFactor === 16 ? 'MAX (16X)' : `${result.scaleFactor}X`} LANCZOS
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Compare original low-res photo with cloud upscaled output.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'side-by-side'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'split'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Split Slider</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('toggle')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'toggle'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>A / B Switch</span>
            </button>
          </div>

          {/* Actions & Zoom */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                disabled={zoomLevel <= 1}
                className="p-1.5 hover:bg-white rounded transition-colors disabled:opacity-40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-gray-800">{zoomLevel}x</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
                disabled={zoomLevel >= 3}
                className="p-1.5 hover:bg-white rounded transition-colors disabled:opacity-40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Real Binary Download */}
            <button
              type="button"
              onClick={() => downloadImageBlob(result.downloadUrl, result.filename)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-black text-white hover:bg-[#1F2937] transition-colors cursor-pointer shadow-xs"
              title="Download real full-size image file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download ({formatBytes(result.newSize)})</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Canvas Area */}
        <div className="relative flex-1 bg-gray-950 overflow-auto select-none min-h-[380px] sm:min-h-[460px] p-4 flex items-center justify-center">
          {/* 1. SIDE-BY-SIDE VIEW (Left: Original, Right: Upscaled) */}
          {viewMode === 'side-by-side' && (
            <div
              className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center transition-transform duration-150"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Original Panel */}
              <div className="flex flex-col items-center justify-center bg-gray-900 rounded-xl p-3 border border-gray-800">
                <div className="mb-2 w-full flex items-center justify-between text-[11px] font-mono text-gray-400 px-1">
                  <span className="font-bold text-white">ORIGINAL</span>
                  <span>{result.originalWidth}×{result.originalHeight}px ({formatBytes(result.originalSize)})</span>
                </div>
                <div className="w-full flex items-center justify-center min-h-[260px] sm:min-h-[340px]">
                  <img
                    src={item.previewUrl}
                    alt="Original Image"
                    className="max-h-[50vh] max-w-full object-contain rounded"
                  />
                </div>
              </div>

              {/* Upscaled Panel */}
              <div className="flex flex-col items-center justify-center bg-gray-900 rounded-xl p-3 border border-emerald-900/40">
                <div className="mb-2 w-full flex items-center justify-between text-[11px] font-mono text-emerald-400 px-1">
                  <span className="font-bold text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    UPSCALED ({result.scaleFactor}X)
                  </span>
                  <span>{result.newWidth}×{result.newHeight}px ({formatBytes(result.newSize)})</span>
                </div>
                <div className="w-full flex items-center justify-center min-h-[260px] sm:min-h-[340px]">
                  <img
                    src={upscaledImageUrl}
                    alt="Upscaled Image"
                    onLoad={() => setImageLoaded(true)}
                    className="max-h-[50vh] max-w-full object-contain rounded shadow-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. SPLIT SLIDER VIEW */}
          {viewMode === 'split' && (
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-full max-w-3xl aspect-[4/3] sm:aspect-video max-h-[62vh] flex items-center justify-center bg-gray-900 rounded-xl overflow-hidden cursor-ew-resize border border-gray-800"
            >
              {/* Background: Upscaled Image */}
              <img
                src={upscaledImageUrl}
                alt="Upscaled"
                className="w-full h-full object-contain block mx-auto pointer-events-none"
              />

              {/* Foreground: Original Image with Clip */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={item.previewUrl}
                  alt="Original"
                  className="w-full h-full object-contain block mx-auto pointer-events-none"
                />
              </div>

              {/* Split Divider Bar */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none z-10"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-white border-2 border-white flex items-center justify-center shadow-lg font-bold text-xs pointer-events-auto cursor-ew-resize">
                  ↔
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 z-20 pointer-events-none">
                <span className="px-2.5 py-1 rounded bg-black/90 text-white text-[11px] font-mono font-bold border border-white/20">
                  Original: {result.originalWidth}×{result.originalHeight}px
                </span>
              </div>
              <div className="absolute top-3 right-3 z-20 pointer-events-none">
                <span className="px-2.5 py-1 rounded bg-black/90 text-emerald-300 text-[11px] font-mono font-bold border border-white/20">
                  Upscaled: {result.newWidth}×{result.newHeight}px ({result.scaleFactor}X)
                </span>
              </div>
            </div>
          )}

          {/* 3. TOGGLE A / B VIEW */}
          {viewMode === 'toggle' && (
            <div className="w-full max-w-3xl flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setShowOriginalInToggle(false)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    !showOriginalInToggle
                      ? 'bg-emerald-500 text-black shadow'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  View Upscaled ({result.newWidth}×{result.newHeight}px)
                </button>
                <button
                  type="button"
                  onClick={() => setShowOriginalInToggle(true)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    showOriginalInToggle
                      ? 'bg-white text-black shadow'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  View Original ({result.originalWidth}×{result.originalHeight}px)
                </button>
              </div>

              <div className="relative w-full aspect-[4/3] sm:aspect-video max-h-[60vh] bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center border border-gray-800 p-2">
                <img
                  src={showOriginalInToggle ? item.previewUrl : upscaledImageUrl}
                  alt={showOriginalInToggle ? 'Original' : 'Upscaled'}
                  className="max-h-full max-w-full object-contain rounded transition-all duration-150"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Click buttons above or tap to instantly compare pixel clarity.
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Spec Strip */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-[#E5E7EB] shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-gray-400 block text-[10px] font-bold uppercase">Dimensions</span>
            <span className="font-semibold text-gray-900 font-mono">
              {result.originalWidth}×{result.originalHeight} → {result.newWidth}×{result.newHeight}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] font-bold uppercase">Real File Size</span>
            <span className="font-semibold text-emerald-700">
              {formatBytes(result.newSize)} (Original: {formatBytes(result.originalSize)})
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] font-bold uppercase">Print Output</span>
            <span className="font-semibold text-gray-900">{printDim.label}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] font-bold uppercase">Metadata Profile</span>
            <span className="font-semibold text-gray-900">
              {result.dpi} DPI · {result.format.toUpperCase()} · Q{result.quality}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
