import React from 'react';
import { ScaleFactor, OutputFormat, DpiValue, getDpiPresetDetails } from '../utils/upscaleMath';
import { UpscaleSettings } from '../types';
import { Sliders, ShieldCheck, Printer, Cpu, Sparkles } from 'lucide-react';

interface SettingsPanelProps {
  settings: UpscaleSettings;
  onChange: (newSettings: UpscaleSettings) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onChange,
  disabled = false,
  compact = false,
}) => {
  const dpiInfo = getDpiPresetDetails(settings.dpi);

  const handleScaleChange = (scaleFactor: ScaleFactor) => {
    onChange({ ...settings, scaleFactor });
  };

  const handleFormatChange = (format: OutputFormat) => {
    onChange({ ...settings, format });
  };

  const handleQualityChange = (quality: number) => {
    onChange({ ...settings, quality });
  };

  const handleDpiChange = (dpi: DpiValue) => {
    onChange({ ...settings, dpi });
  };

  const scaleFactors: { factor: ScaleFactor; label: string; sub: string }[] = [
    { factor: 2, label: '2X', sub: 'Double' },
    { factor: 3, label: '3X', sub: 'Triple' },
    { factor: 4, label: '4X', sub: 'Quad HD' },
    { factor: 8, label: '8X', sub: 'Extreme' },
    { factor: 16, label: 'MAX', sub: '16X Ultra' },
  ];

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-gray-900" />
          <h2 className="text-sm font-bold text-gray-900 tracking-tight uppercase">
            Image Customization & Settings
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
          Selected: {settings.scaleFactor === 16 ? 'MAX (16X)' : `${settings.scaleFactor}X`} · {settings.dpi} DPI · {settings.format.toUpperCase()}
        </span>
      </div>

      {/* 1. Upscaling Factor Buttons (2X, 3X, 4X, 8X, MAX) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <span>1. Upscaling Multiplier</span>
            <span className="text-gray-400 font-normal">(Pixel Resampling Factor)</span>
          </label>
          <span className="text-xs font-mono font-bold text-gray-900 bg-black text-white px-2 py-0.5 rounded">
            {settings.scaleFactor === 16 ? 'MAX (16X)' : `${settings.scaleFactor}X Scale`}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {scaleFactors.map(({ factor, label, sub }) => {
            const isActive = settings.scaleFactor === factor;
            return (
              <button
                key={factor}
                type="button"
                disabled={disabled}
                onClick={() => handleScaleChange(factor)}
                className={`py-3 px-1 sm:px-2 rounded-lg text-xs sm:text-sm font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isActive
                    ? 'bg-black text-white border-black shadow-sm ring-2 ring-black/20'
                    : 'bg-white text-gray-800 border-[#E5E7EB] hover:bg-gray-100 hover:border-gray-400'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={`Upscale image ${factor} times with Lanczos-3`}
              >
                <span className="text-sm sm:text-base font-extrabold tracking-tight">
                  {label}
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold ${
                    isActive ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {sub}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-gray-500">
          Aspect-ratio safe LANCZOS-3 resampling: a 1000×1000px photo becomes{' '}
          <strong className="text-gray-900 font-semibold">
            {1000 * settings.scaleFactor}×{1000 * settings.scaleFactor}px
          </strong>{' '}
          with zero distortion.
        </p>
      </div>

      {/* Grid of Format & DPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 2. Output Format Dropdown */}
        <div>
          <label htmlFor="output-format-select" className="block text-xs font-bold text-gray-900 mb-2">
            2. Output Format
          </label>
          <div className="relative">
            <select
              id="output-format-select"
              disabled={disabled}
              value={settings.format}
              onChange={(e) => handleFormatChange(e.target.value as OutputFormat)}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black appearance-none cursor-pointer"
            >
              <option value="png">PNG (Lossless & High Sharpness)</option>
              <option value="jpeg">JPEG (Universal Compact Format)</option>
              <option value="webp">WEBP (Next-Gen Web Optimization)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-gray-500">
            {settings.format === 'png' && 'Lossless compression preserving full crispness and transparency.'}
            {settings.format === 'jpeg' && 'Standard photographic image with 4:4:4 chroma subsampling.'}
            {settings.format === 'webp' && 'Maximum compression efficiency with modern alpha transparency.'}
          </p>
        </div>

        {/* 3. Target DPI Selector */}
        <div>
          <label htmlFor="target-dpi-select" className="block text-xs font-bold text-gray-900 mb-2">
            3. Target Print DPI
          </label>
          <div className="relative">
            <select
              id="target-dpi-select"
              disabled={disabled}
              value={settings.dpi}
              onChange={(e) => handleDpiChange(Number(e.target.value) as DpiValue)}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black appearance-none cursor-pointer"
            >
              <option value={72}>72 DPI (Web & Screens)</option>
              <option value={150}>150 DPI (Draft Print)</option>
              <option value={300}>300 DPI (Standard Print - Recommended)</option>
              <option value={600}>600 DPI (Fine Art Print)</option>
              <option value={1200}>1200 DPI (Max Detail & Archival)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-gray-500">
            {dpiInfo.shortTag}: {dpiInfo.description}
          </p>
        </div>
      </div>

      {/* 4. Quality Slider (70% - 100%) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="quality-slider" className="text-xs font-bold text-gray-900">
            4. Compression Quality Control (JPEG / WEBP)
          </label>
          <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
            {settings.quality}%
          </span>
        </div>
        <input
          id="quality-slider"
          type="range"
          min={70}
          max={100}
          step={1}
          disabled={disabled || settings.format === 'png'}
          value={settings.quality}
          onChange={(e) => handleQualityChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
        />
        <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-1">
          <span>70% (Compact File)</span>
          <span className="text-gray-900 font-semibold">90% (Recommended)</span>
          <span>100% (Maximum Fidelity)</span>
        </div>
        {settings.format === 'png' && (
          <p className="mt-1 text-[11px] text-gray-500 italic">
            * PNG uses lossless compression (always 100% pixel fidelity).
          </p>
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-gray-700">
          <Printer className="w-4 h-4 text-gray-900 shrink-0" />
          <span className="text-[11px]">
            <strong>Print Profile:</strong> Embedded {settings.dpi} DPI JFIF/EXIF/pHYs headers ready for high-definition reproduction.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>Zero Client CPU Load</span>
        </div>
      </div>
    </div>
  );
};
