import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { SettingsPanel } from './components/SettingsPanel';
import { QueueDashboard } from './components/QueueDashboard';
import { SplitComparisonModal } from './components/SplitComparisonModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { DeployModal } from './components/DeployModal';
import { ImageQueueItem, UpscaleSettings } from './types';
import { createSampleImageFile } from './utils/sampleImages';
import { downloadBlobAsFile } from './utils/downloadHelper';
import { SlidersHorizontal, Info, ShieldCheck, Zap, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<ImageQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState(true);
  const [activeCompareItem, setActiveCompareItem] = useState<ImageQueueItem | null>(null);
  const [previewOriginalItem, setPreviewOriginalItem] = useState<ImageQueueItem | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);

  // Global settings state with 2X, 3X, 4X, 8X, and 16X (MAX)
  const [settings, setSettings] = useState<UpscaleSettings>({
    scaleFactor: 4, // Default to 4X Quad HD
    format: 'png',
    quality: 90,
    dpi: 300,
  });

  // Health check on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (res.ok) setServerOnline(true);
      })
      .catch(() => setServerOnline(false));
  }, []);

  // Helper to extract image dimensions
  const readImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  // Add files to queue
  const handleAddFiles = async (newFiles: File[]) => {
    const newItems: ImageQueueItem[] = [];

    for (const file of newFiles) {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const previewUrl = URL.createObjectURL(file);
      const { width, height } = await readImageDimensions(file);

      newItems.push({
        id,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        width,
        height,
        status: 'idle',
        progress: 0,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  };

  // Load sample demo photos
  const handleLoadSamples = async () => {
    try {
      const f1 = await createSampleImageFile('skyline');
      const f2 = await createSampleImageFile('portrait');
      const f3 = await createSampleImageFile('macro');
      const f4 = await createSampleImageFile('emblem');
      await handleAddFiles([f1, f2, f3, f4]);
    } catch (e) {
      console.error('Failed to generate sample images:', e);
    }
  };

  // Clear all items
  const handleClearAll = () => {
    if (isProcessing) return;
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
  };

  // Remove individual item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  // Start cloud upscaling queue
  const handleStartUpscale = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const pendingItems = items.filter((i) => i.status !== 'completed');

    // Mark pending items as queued
    setItems((prev) =>
      prev.map((i) => (i.status !== 'completed' ? { ...i, status: 'queued', progress: 10 } : i))
    );

    // Process items through cloud backend
    for (const current of pendingItems) {
      setItems((prev) =>
        prev.map((i) => (i.id === current.id ? { ...i, status: 'processing', progress: 40 } : i))
      );

      try {
        const formData = new FormData();
        formData.append('image', current.file);
        formData.append('scaleFactor', String(settings.scaleFactor));
        formData.append('format', settings.format);
        formData.append('quality', String(settings.quality));
        formData.append('dpi', String(settings.dpi));

        const response = await fetch('/api/upscale', {
          method: 'POST',
          body: formData,
        });

        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
          let errorMsg = `Server error (${response.status})`;
          if (contentType.includes('application/json')) {
            const errData = await response.json().catch(() => ({}));
            errorMsg = errData.error || errorMsg;
          } else {
            errorMsg =
              response.status === 504
                ? 'Cloud processing timed out. Please choose a smaller factor (2X, 3X, or 4X).'
                : `Cloud server error (${response.status}). Please try again.`;
          }
          throw new Error(errorMsg);
        }

        if (!contentType.includes('application/json')) {
          throw new Error('Unexpected non-JSON response from server. Please retry.');
        }

        const data = await response.json();

        setItems((prev) =>
          prev.map((i) =>
            i.id === current.id
              ? {
                  ...i,
                  status: 'completed',
                  progress: 100,
                  result: {
                    id: data.id,
                    filename: data.filename,
                    originalWidth: data.originalWidth,
                    originalHeight: data.originalHeight,
                    newWidth: data.newWidth,
                    newHeight: data.newHeight,
                    scaleFactor: data.scaleFactor,
                    originalSize: data.originalSize,
                    newSize: data.newSize,
                    format: data.format,
                    quality: data.quality,
                    dpi: data.dpi,
                    downloadUrl: data.downloadUrl,
                  },
                }
              : i
          )
        );
      } catch (err: any) {
        console.error('Upscale failed for item:', current.name, err);
        setItems((prev) =>
          prev.map((i) =>
            i.id === current.id
              ? {
                  ...i,
                  status: 'failed',
                  progress: 0,
                  error: err.message || 'Upscaling failed',
                }
              : i
          )
        );
      }
    }

    setIsProcessing(false);
  };

  // Master ZIP download
  const handleDownloadAllZip = async () => {
    const completedItems = items.filter((i) => i.status === 'completed' && i.result);
    if (completedItems.length === 0) return;

    try {
      setIsDownloadingZip(true);
      setZipError(null);
      const filenames = completedItems.map((i) => i.result!.filename);

      const response = await fetch('/api/zip-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to generate ZIP archive from server.';
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch {
          // ignore parsing error
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const zipFilename = `upscale_pro_batch_${Date.now()}.zip`;
      downloadBlobAsFile(blob, zipFilename);
    } catch (err: any) {
      console.error('ZIP Download error:', err);
      setZipError(err.message || 'ZIP download failed. Please try again.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-gray-900 flex flex-col font-sans antialiased selection:bg-black selection:text-white">
      {/* Top Header */}
      <Header
        onLoadSamples={handleLoadSamples}
        onOpenDeployModal={() => setShowDeployModal(true)}
        serverOnline={serverOnline}
        totalQueuedCount={items.length}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Intro banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">
                High-Precision Cloud Image Upscaling
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                100% Free
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              Heavy calculations run strictly on the cloud server. Customize your multiplier (<strong>2X, 3X, 4X, 8X, MAX</strong>), target DPI, and format below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSamples}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border border-[#E5E7EB] bg-white text-gray-900 hover:bg-gray-100 transition-colors shadow-xs"
              title="Load sample test images"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Load 4 Sample Photos</span>
            </button>
          </div>
        </div>

        {/* 1. CUSTOMIZATION SETTINGS PANEL (Prominently placed at the top for easy access on all screens) */}
        <section aria-label="Upscaling Settings">
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            disabled={isProcessing}
          />
        </section>

        {/* 2. UPLOAD SECTION */}
        <section aria-label="Upload Zone">
          <UploadZone
            items={items}
            onAddFiles={handleAddFiles}
            onClearAll={handleClearAll}
            onStartUpscale={handleStartUpscale}
            isProcessing={isProcessing}
          />
        </section>

        {/* 3. LIVE PROCESSING QUEUE & COMPLETED CARDS */}
        <section aria-label="Batch Queue">
          {zipError && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{zipError}</span>
              </div>
              <button
                type="button"
                onClick={() => setZipError(null)}
                className="text-red-700 hover:text-red-900 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
          <QueueDashboard
            items={items}
            onRemoveItem={handleRemoveItem}
            onOpenCompare={(item) => setActiveCompareItem(item)}
            onPreviewOriginal={(item) => setPreviewOriginalItem(item)}
            onDownloadAllZip={handleDownloadAllZip}
            isDownloadingZip={isDownloadingZip}
          />
        </section>

        {/* Quick Tips Box if empty */}
        {items.length === 0 && (
          <div className="p-5 rounded-xl border border-[#E5E7EB] bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-gray-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  Ready to Upscale
                </h4>
                <p className="text-[11px] text-gray-500">
                  Select your desired scale factor (2X, 3X, 4X, 8X, or MAX) above, then drag & drop your photos or click the sample button.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLoadSamples}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-black text-white hover:bg-[#1F2937] transition-colors shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Sample Photos</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">Upscale Pro</span>
            <span>·</span>
            <span>Zero-CPU Client Architecture</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">100% Free Cloud Resampling</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDeployModal(true)}
              className="text-gray-700 hover:text-black font-medium underline underline-offset-2"
            >
              GitHub & Backend Architecture
            </button>
            <span>•</span>
            <span>LANCZOS-3 Sinc-Filter Kernel</span>
          </div>
        </div>
      </footer>

      {/* Interactive Split Comparison Modal */}
      {activeCompareItem && (
        <SplitComparisonModal
          item={activeCompareItem}
          onClose={() => setActiveCompareItem(null)}
        />
      )}

      {/* Original Image Preview Modal */}
      {previewOriginalItem && (
        <ImagePreviewModal
          item={previewOriginalItem}
          onClose={() => setPreviewOriginalItem(null)}
        />
      )}

      {/* Architecture & Deploy Modal */}
      {showDeployModal && <DeployModal onClose={() => setShowDeployModal(false)} />}
    </div>
  );
}
