import { ScaleFactor, OutputFormat, DpiValue } from './utils/upscaleMath';

export type ItemStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

export interface ImageQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  width?: number;
  height?: number;
  status: ItemStatus;
  progress: number;
  error?: string;
  // Completed attributes
  result?: {
    id: string;
    filename: string;
    originalWidth: number;
    originalHeight: number;
    newWidth: number;
    newHeight: number;
    scaleFactor: ScaleFactor;
    originalSize: number;
    newSize: number;
    format: OutputFormat;
    quality: number;
    dpi: DpiValue;
    downloadUrl: string;
  };
}

export interface UpscaleSettings {
  scaleFactor: ScaleFactor;
  format: OutputFormat;
  quality: number;
  dpi: DpiValue;
}
