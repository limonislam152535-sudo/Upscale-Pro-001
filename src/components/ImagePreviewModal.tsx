import React from 'react';
import { ImageQueueItem } from '../types';
import { formatBytes } from '../utils/upscaleMath';
import { X, Eye, FileImage } from 'lucide-react';

interface ImagePreviewModalProps {
  item: ImageQueueItem;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <FileImage className="w-4 h-4 text-gray-900" />
            <h3 className="text-sm font-bold text-gray-900 truncate max-w-md">
              {item.name}
            </h3>
            <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {item.width && item.height ? `${item.width}×${item.height}px` : 'Image Preview'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Canvas */}
        <div className="flex-1 bg-gray-950 p-4 flex items-center justify-center min-h-[340px] sm:min-h-[420px] overflow-auto">
          <img
            src={item.previewUrl}
            alt={item.name}
            className="max-h-[60vh] max-w-full object-contain rounded shadow"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-gray-600">
          <span>File Size: <strong className="text-gray-900">{formatBytes(item.size)}</strong></span>
          <span className="text-[11px] text-gray-500">Ready to upscale with cloud Lanczos kernel</span>
        </div>
      </div>
    </div>
  );
};
