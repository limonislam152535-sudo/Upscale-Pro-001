/**
 * Upscale Pro - Core Pure Logic & Mathematical Transforms
 * Decoupled from UI for deterministic calculations and unit testing.
 */

export type ScaleFactor = 2 | 3 | 4 | 8 | 16;
export type OutputFormat = 'jpeg' | 'png' | 'webp';
export type DpiValue = 72 | 150 | 300 | 600 | 1200;

export interface ScaledDimensions {
  width: number;
  height: number;
  scaleFactor: ScaleFactor;
  totalMegapixels: number;
  aspectRatio: number;
}

export interface PrintDimensions {
  widthInches: number;
  heightInches: number;
  widthCm: number;
  heightCm: number;
  label: string;
}

/**
 * Calculates output pixel dimensions with 100% strict aspect ratio preservation.
 * Safely clamps extreme dimensions to 8192px max (8K UHD) to prevent server gateway timeouts.
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  scaleFactor: ScaleFactor
): ScaledDimensions {
  if (origWidth <= 0 || origHeight <= 0) {
    throw new Error('Image dimensions must be positive integers');
  }

  let width = Math.round(origWidth * scaleFactor);
  let height = Math.round(origHeight * scaleFactor);

  // Safety ceiling: 16384px (16K Master Print standard) allowing true 16X on standard images
  const MAX_DIM = 16384;
  if (width > MAX_DIM || height > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const totalMegapixels = Number(((width * height) / 1000000).toFixed(2));
  const aspectRatio = Number((width / height).toFixed(4));

  return {
    width,
    height,
    scaleFactor,
    totalMegapixels,
    aspectRatio,
  };
}

/**
 * Computes the physical print output dimensions at a given DPI header target.
 */
export function calculatePrintDimensions(
  pixelWidth: number,
  pixelHeight: number,
  dpi: DpiValue | number
): PrintDimensions {
  if (dpi <= 0) {
    throw new Error('DPI must be greater than zero');
  }
  const widthInches = Number((pixelWidth / dpi).toFixed(2));
  const heightInches = Number((pixelHeight / dpi).toFixed(2));
  const widthCm = Number((widthInches * 2.54).toFixed(1));
  const heightCm = Number((heightInches * 2.54).toFixed(1));

  return {
    widthInches,
    heightInches,
    widthCm,
    heightCm,
    label: `${widthInches}" × ${heightInches}" (${widthCm} × ${heightCm} cm)`,
  };
}

/**
 * Formats bytes to standard human-readable format.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Validates uploaded image file against format and maximum size constraints.
 */
export function validateImageFile(file: {
  name: string;
  size: number;
  type?: string;
}): { valid: boolean; error?: string } {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileNameLower = file.name.toLowerCase();
  const hasValidExt = allowedExtensions.some((ext) => fileNameLower.endsWith(ext));

  if (!hasValidExt) {
    return {
      valid: false,
      error: `Unsupported format. Only JPG, JPEG, PNG, and WEBP are supported.`,
    };
  }

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File exceeds 50MB maximum limit (${formatBytes(file.size)}).`,
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: `File is empty or corrupted (0 bytes).`,
    };
  }

  return { valid: true };
}

/**
 * Metadata descriptions for DPI presets.
 */
export function getDpiPresetDetails(dpi: DpiValue): {
  label: string;
  shortTag: string;
  description: string;
  bestFor: string;
} {
  switch (dpi) {
    case 72:
      return {
        label: '72 DPI (Web & Screen)',
        shortTag: '72 DPI',
        description: 'Standard digital display density for web apps, social media, and presentations.',
        bestFor: 'Websites, social media, email attachments',
      };
    case 150:
      return {
        label: '150 DPI (Draft Print)',
        shortTag: '150 DPI',
        description: 'Medium quality print resolution for internal docs, flyers, and quick prints.',
        bestFor: 'Drafts, flyers, quick office printouts',
      };
    case 300:
      return {
        label: '300 DPI (Standard Print)',
        shortTag: '300 DPI',
        description: 'Publishing industry gold standard for crisp photo prints, magazines, and marketing collaterals.',
        bestFor: 'Photo books, framing, brochures, commercial print',
      };
    case 600:
      return {
        label: '600 DPI (Fine Art Print)',
        shortTag: '600 DPI',
        description: 'Professional high-definition density for large-format exhibition and gallery reproductions.',
        bestFor: 'Art prints, gallery exhibitions, posters',
      };
    case 1200:
      return {
        label: '1200 DPI (Max Detail)',
        shortTag: '1200 DPI',
        description: 'Extreme precision archival density preserving micro-text, line art, and macro details.',
        bestFor: 'Archival preservation, blueprints, ultra-fine detail',
      };
  }
}
