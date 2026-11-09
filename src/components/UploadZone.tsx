import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, ArrowUpRight, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatBytes, validateImageFile } from '../utils/upscaleMath';
import { ImageQueueItem } from '../types';

interface UploadZoneProps {
  items: ImageQueueItem[];
  onAddFiles: (files: File[]) => void;
  onClearAll: () => void;
  onStartUpscale: () => void;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  items,
  onAddFiles,
  onClearAll,
  onStartUpscale,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalSize = items.reduce((acc, curr) => acc + curr.size, 0);
  const uncompletedCount = items.filter((i) => i.status !== 'completed').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setValidationError(null);

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach((file) => {
      const val = validateImageFile(file);
      if (val.valid) {
        validFiles.push(file);
      } else if (errors.length < 2) {
        errors.push(`${file.name}: ${val.error}`);
      }
    });

    if (errors.length > 0) {
      setValidationError(errors.join(' | '));
    }

    if (validFiles.length > 0) {
      onAddFiles(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-xs space-y-4">
      {/* Drag & Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 transition-all text-center cursor-pointer select-none ${
          isDragOver
            ? 'border-black bg-gray-50/80 scale-[0.995]'
            : 'border-[#E5E7EB] bg-white hover:border-gray-400 hover:bg-gray-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-7 h-7 text-black stroke-[1.75]" />
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-1">
            Drag & drop images here, or <span className="underline decoration-1 underline-offset-2">browse files</span>
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Supports batch upload of up to 200 images simultaneously (max 50MB per image).
          </p>

          {/* Supported Format Badges */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {['JPG', 'JPEG', 'PNG', 'WEBP'].map((fmt) => (
              <span
                key={fmt}
                className="px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-700 rounded border border-gray-200"
              >
                {fmt}
              </span>
            ))}
            <span className="text-[11px] text-gray-400 font-medium ml-1">
              · 100% Client GPU Offloaded
            </span>
          </div>
        </div>
      </div>

      {/* Validation Message */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Upload Metadata & Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#E5E7EB]">
        {/* File Count & Total Size Indicator */}
        <div className="flex items-center gap-3 text-xs text-gray-600 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-900">
              {items.length} {items.length === 1 ? 'image' : 'images'}
            </span>
            {items.length > 0 && (
              <span className="text-gray-400">({formatBytes(totalSize)})</span>
            )}
          </div>

          {completedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              {completedCount} completed
            </span>
          )}
        </div>

        {/* Buttons: Clear All & Start Cloud Upscale */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            disabled={items.length === 0 || isProcessing}
            onClick={onClearAll}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold border border-[#E5E7EB] text-gray-700 bg-white hover:bg-gray-100 hover:text-gray-900 transition-colors ${
              items.length === 0 || isProcessing
                ? 'opacity-40 cursor-not-allowed hover:bg-white'
                : 'cursor-pointer'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>

          <button
            type="button"
            disabled={uncompletedCount === 0 || isProcessing}
            onClick={onStartUpscale}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-[#000000] text-[#FFFFFF] hover:bg-[#1F2937] transition-all shadow-xs ${
              uncompletedCount === 0 || isProcessing
                ? 'opacity-40 cursor-not-allowed hover:bg-black'
                : 'cursor-pointer hover:shadow'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Cloud Queue...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>
                  Start Cloud Upscale
                  {uncompletedCount > 0 ? ` (${uncompletedCount})` : ''}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
