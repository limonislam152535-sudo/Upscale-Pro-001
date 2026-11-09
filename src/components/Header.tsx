import React from 'react';
import { Sparkles, Server, Github, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onLoadSamples: () => void;
  onOpenDeployModal: () => void;
  serverOnline: boolean;
  totalQueuedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSamples,
  onOpenDeployModal,
  serverOnline,
  totalQueuedCount,
}) => {
  return (
    <header className="border-b border-[#E5E7EB] bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Product Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-bold tracking-tight shadow-sm">
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-gray-900">
                Upscale <span className="font-extrabold">Pro</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                Cloud Edition
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Zero client GPU/CPU load · High-precision Lanczos-3 cloud engine
            </p>
          </div>
        </div>

        {/* Server Status Indicator & Header Actions */}
        <div className="flex items-center gap-3">
          {/* Cloud Health Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-gray-50 text-xs text-gray-700">
            <span
              className={`w-2 h-2 rounded-full ${
                serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-medium">
              {serverOnline ? 'Cloud Server: Active' : 'Connecting to Server...'}
            </span>
            <Server className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
          </div>

          {/* Quick Sample Button */}
          <button
            onClick={onLoadSamples}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#E5E7EB] text-gray-800 hover:bg-gray-100 transition-colors"
            title="Load 4 instant sample test images with diverse dimensions"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Load Sample Photos</span>
            <span className="sm:hidden">Samples</span>
          </button>

          {/* Deploy / GitHub Info */}
          <button
            onClick={onOpenDeployModal}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[#E5E7EB] text-gray-700 hover:bg-gray-100 transition-colors"
            title="View Python FastAPI backend structure & deployment instructions"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden md:inline">GitHub / Deploy</span>
          </button>
        </div>
      </div>
    </header>
  );
};
