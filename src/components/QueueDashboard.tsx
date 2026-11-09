import React, { useState } from 'react';
import { ImageQueueItem } from '../types';
import { formatBytes } from '../utils/upscaleMath';
import { downloadImageBlob } from '../utils/downloadHelper';
import {
  Download,
  Archive,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface QueueDashboardProps {
  items: ImageQueueItem[];
  onRemoveItem: (id: string) => void;
  onOpenCompare: (item: ImageQueueItem) => void;
  onPreviewOriginal?: (item: ImageQueueItem) => void;
  onDownloadAllZip: () => void;
  isDownloadingZip: boolean;
}

export const QueueDashboard: React.FC<QueueDashboardProps> = ({
  items,
  onRemoveItem,
  onOpenCompare,
  onPreviewOriginal,
  onDownloadAllZip,
  isDownloadingZip,
}) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'queued'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (items.length === 0) {
    return null;
  }

  const completedItems = items.filter((i) => i.status === 'completed');
  const processingItems = items.filter((i) => i.status === 'processing');
  const queuedItems = items.filter((i) => i.status === 'queued' || i.status === 'idle');

  const totalCount = items.length;
  const completedCount = completedItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const canDownloadZip = completedCount > 0;

  const filteredItems = items.filter((item) => {
    if (filter === 'completed') return item.status === 'completed';
    if (filter === 'processing') return item.status === 'processing';
    if (filter === 'queued') return item.status === 'queued' || item.status === 'idle';
    return true;
  });

  const handleDownloadSingle = async (item: ImageQueueItem) => {
    if (!item.result) return;
    try {
      setDownloadError(null);
      setDownloadingId(item.id);
      // Fetches complete binary stream and triggers genuine Blob download
      await downloadImageBlob(item.result.downloadUrl, item.result.filename);
    } catch (err: any) {
      setDownloadError(`Download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {downloadError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{downloadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadError(null)}
            className="text-red-700 hover:text-red-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      {/* Dashboard Top Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">
              Processing Queue & Completed Outputs
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
              {completedCount} / {totalCount} Done
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Cloud-calculated resolution · Full native binary downloads with embedded DPI
          </p>
        </div>

        {/* Master "Download All as ZIP" Button */}
        <div>
          <button
            type="button"
            disabled={!canDownloadZip || isDownloadingZip}
            onClick={onDownloadAllZip}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              canDownloadZip && !isDownloadingZip
                ? 'bg-black text-white hover:bg-[#1F2937] shadow-xs cursor-pointer'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
            title={
              canDownloadZip
                ? `Download all ${completedCount} completed images as a single .ZIP archive`
                : 'Complete at least 1 image to download ZIP'
            }
          >
            {isDownloadingZip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Creating Full ZIP Archive...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>
                  Download All as ZIP
                  {completedCount > 0 ? ` (${completedCount})` : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
          <span>Overall Batch Progress</span>
          <span className="text-gray-900 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-[#E5E7EB]">
          <div
            className="bg-black h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-black text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            filter === 'completed'
              ? 'bg-black text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Completed ({completedCount})
        </button>
        {processingItems.length > 0 && (
          <button
            onClick={() => setFilter('processing')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              filter === 'processing'
                ? 'bg-black text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Processing ({processingItems.length})
          </button>
        )}
        {queuedItems.length > 0 && (
          <button
            onClick={() => setFilter('queued')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              filter === 'queued'
                ? 'bg-black text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            In Queue ({queuedItems.length})
          </button>
        )}
      </div>

      {/* Individual Image Cards */}
      <div className="grid grid-cols-1 gap-3">
        {filteredItems.map((item) => {
          const isCompleted = item.status === 'completed';
          const isProcessing = item.status === 'processing';
          const isFailed = item.status === 'failed';
          const isWaiting = item.status === 'queued' || item.status === 'idle';
          const isDownloadingThis = downloadingId === item.id;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isCompleted
                  ? 'border-[#E5E7EB] bg-white hover:border-gray-300'
                  : isProcessing
                  ? 'border-black/30 bg-gray-50/70 shadow-xs'
                  : isFailed
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-[#E5E7EB] bg-white'
              }`}
            >
              {/* Left: Thumbnail Preview & Transformation Specs */}
              <div className="flex items-center gap-3.5 min-w-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => (isCompleted ? onOpenCompare(item) : onPreviewOriginal?.(item))}
                  className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center group cursor-pointer hover:ring-2 hover:ring-black transition-all"
                  title="Click to preview full image"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {isCompleted && (
                    <div className="absolute top-1 right-1 bg-black text-white p-0.5 rounded shadow">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                </button>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-gray-900 truncate" title={item.name}>
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                    <span>Original: {formatBytes(item.size)}</span>
                    {item.width && item.height && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{item.width}×{item.height}px</span>
                      </>
                    )}
                  </div>

                  {/* Dimension & File Size Transformation Badges */}
                  {isCompleted && item.result && (
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-black text-white">
                        <span>{item.result.originalWidth}×{item.result.originalHeight}</span>
                        <span>→</span>
                        <span className="text-emerald-300 font-bold">{item.result.newWidth}×{item.result.newHeight}</span>
                      </span>

                      <span className="text-[11px] font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {item.result.scaleFactor === 16 ? 'MAX (16X)' : `${item.result.scaleFactor}X`} · {item.result.dpi} DPI · {item.result.format.toUpperCase()}
                      </span>

                      {/* Explicit File Size confirmation */}
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {formatBytes(item.result.newSize)} Real File
                      </span>
                    </div>
                  )}

                  {isFailed && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.error || 'Server error occurred during upscaling.'}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Status Pill & Real Download Action */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                {/* Status Indicator */}
                <div>
                  {isWaiting && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>Waiting in queue...</span>
                    </span>
                  )}
                  {isProcessing && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white shadow-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Cloud processing...</span>
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Completed</span>
                    </span>
                  )}
                  {isFailed && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Failed</span>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Preview Original (for uncompleted items) */}
                  {!isCompleted && !isProcessing && (
                    <button
                      type="button"
                      onClick={() => onPreviewOriginal?.(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E7EB] text-gray-700 bg-white hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Preview original image"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-600" />
                      <span>Preview</span>
                    </button>
                  )}

                  {/* Compare Before / After Split Slider (for completed items) */}
                  {isCompleted && (
                    <button
                      type="button"
                      onClick={() => onOpenCompare(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E7EB] text-gray-800 bg-white hover:bg-gray-100 transition-colors cursor-pointer shadow-2xs"
                      title="Inspect pixel-level comparison preview"
                    >
                      <Eye className="w-3.5 h-3.5 text-black" />
                      <span>Preview & Compare</span>
                    </button>
                  )}

                  {/* REAL Binary Download Button using fetch + Blob */}
                  {isCompleted && item.result && (
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(item)}
                      disabled={isDownloadingThis}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-black text-white hover:bg-[#1F2937] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                      title={`Download genuine binary file (${formatBytes(item.result.newSize)})`}
                    >
                      {isDownloadingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Remove Item Button */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={isProcessing}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
