import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Cloud, Server, ExternalLink, ShieldCheck } from 'lucide-react';

interface DeployModalProps {
  onClose: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({ onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const fastApiCode = `from fastapi import FastAPI, UploadFile, File, Form
from PIL import Image
import io

app = FastAPI()

@app.post("/api/upscale")
async def upscale(image: UploadFile = File(...), scaleFactor: int = Form(2), dpi: int = Form(300)):
    data = await image.read()
    img = Image.open(io.BytesIO(data))
    new_w, new_h = img.width * scaleFactor, img.height * scaleFactor
    upscaled = img.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)
    # Target DPI header embedded directly
    buf = io.BytesIO()
    upscaled.save(buf, format="PNG", dpi=(dpi, dpi))
    return {"width": new_w, "height": new_h, "dpi": dpi}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Cloud Architecture & Deployment Guide
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Production structure for GitHub, Vercel (Frontend), and Render / HF Spaces (Python FastAPI).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-700">
          {/* Architecture Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2">
              <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                <Cloud className="w-4 h-4 text-black" />
                <span>Frontend (Vercel)</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Client acts strictly as a lightweight browser controller. Zero heavy math or canvas rendering runs on user devices.
              </p>
              <div className="text-[11px] font-mono bg-white p-2 rounded border border-gray-200">
                Framework: React / Tailwind CSS
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2">
              <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>Backend (Python FastAPI)</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Hosted on Render or Hugging Face Spaces. Performs Pillow <code>LANCZOS</code> resampling with hardware offloading and embedded DPI.
              </p>
              <div className="text-[11px] font-mono bg-white p-2 rounded border border-gray-200">
                Engine: Pillow + Uvicorn (FastAPI)
              </div>
            </div>
          </div>

          {/* Repository Tree */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                Repository Layout
              </span>
              <span className="text-[11px] text-gray-500 font-mono">/upscale-pro</span>
            </div>
            <pre className="p-3.5 bg-gray-900 text-gray-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
{`/upscale-pro
  ├── backend/               # Python FastAPI backend
  │    ├── main.py           # Endpoints: /api/upscale, /api/download, /api/zip-download
  │    ├── requirements.txt  # FastAPI, Pillow, Uvicorn, python-multipart
  │    └── Dockerfile        # Container build for Render / HF Spaces
  ├── src/                   # React Frontend (Tailwind, Lucide, Motion)
  │    ├── components/       # UploadZone, SettingsPanel, QueueDashboard, ComparisonModal
  │    ├── utils/            # Upscale math, aspect ratio rules, sample images
  │    └── App.tsx           # Dashboard logic & state
  ├── server.ts              # Express engine with Sharp Lanczos3 & unified dev
  └── README.md              # Step-by-step setup and deployment guide`}
            </pre>
          </div>

          {/* Quick Deploy Steps */}
          <div className="space-y-3">
            <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] block">
              1-Minute Deployment Runbook
            </span>

            <div className="border border-gray-200 rounded-xl divide-y divide-gray-200 bg-white">
              <div className="p-3.5">
                <span className="font-bold text-gray-900 block mb-1">
                  1. Deploy Backend to Render.com (Free)
                </span>
                <p className="text-gray-600 text-[11px]">
                  Create a new Web Service pointing to <code>backend/</code>. Render auto-installs <code>requirements.txt</code> and runs <code>uvicorn main:app --host 0.0.0.0 --port $PORT</code>.
                </p>
              </div>

              <div className="p-3.5">
                <span className="font-bold text-gray-900 block mb-1">
                  2. Deploy Frontend to Vercel (Free)
                </span>
                <p className="text-gray-600 text-[11px]">
                  Import your repository on Vercel. Set build preset to <strong>Vite</strong> and configure environment variable:
                </p>
                <code className="mt-1 inline-block px-2 py-1 bg-gray-100 rounded text-gray-800 font-mono text-[11px]">
                  VITE_BACKEND_URL=https://your-backend.onrender.com
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-[#E5E7EB] shrink-0 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-black text-white hover:bg-[#1F2937] transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
