# Upscale Pro ⚡
### Professional Cloud-Based Image Upscaling Web Application

Upscale Pro is a 100% free, high-performance image upscaling application.
The user's device acts strictly as a lightweight browser client: **zero local CPU/GPU processing**. All image enhancement, LANCZOS resampling, and target DPI metadata injections occur entirely on the cloud server backend.

---

## 🚀 Key Features

- **Multi-Factor Upscaling**: True pixel-level scaling for **2X**, **4X**, and **8X** (e.g., 765×1024 at 2X becomes 1530×2048).
- **High-Fidelity Resampling**: Uses the **LANCZOS-3** sinc-filter kernel for razor-sharp edge reconstruction without blurring.
- **Header DPI Metadata Injection**: Embeds target DPI (`72 DPI`, `150 DPI`, `300 DPI (Standard Print)`, `600 DPI`, `1200 DPI`) directly into JFIF, EXIF, and PNG pHYs density headers.
- **High-Capacity Batch Processing**: Drag-and-drop support for 150–200 images simultaneously with real-time queue states.
- **Output Formats**: Flexible conversion to **JPEG**, **PNG**, and **WEBP** with an adjustable quality compression slider (70% – 100%).
- **Interactive Before/After Slider**: Split-screen magnifying comparison to inspect fine details side by side.
- **Batch ZIP Export**: Master "Download All as ZIP" archive button for completed queues.

---

## 📁 Repository Structure

```text
/upscale-pro
  ├── backend/               # Python FastAPI application
  │    ├── main.py           # Endpoints: /api/upscale, /api/download/{f}, /api/zip-download
  │    ├── requirements.txt  # FastAPI, Uvicorn, Pillow, python-multipart
  │    └── Dockerfile        # Container setup for Render / HF Spaces / Cloud Run
  ├── src/                   # React Frontend (Tailwind CSS, Motion, Lucide)
  │    ├── components/       # Upload zone, Settings panel, Batch queue, Split comparison modal
  │    ├── utils/            # Decoupled math, aspect ratio calculations, DPI converters
  │    ├── App.tsx           # Main application dashboard
  │    └── main.tsx          # Application entry point
  ├── server.ts              # Full-stack Node/Express engine for local & unified cloud preview
  └── README.md              # Architecture and deployment guide
```

---

## 🛠️ Deployment Instructions

### 1. Deploying the Backend (Python FastAPI)

#### Option A: Render.com (Free Web Service)
1. Fork or push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set **Root Directory** to `backend`.
5. Set **Runtime** to `Python 3` (or choose Docker).
6. Build Command: `pip install -r requirements.txt`
7. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
8. Copy your Render service URL (e.g., `https://upscale-pro-backend.onrender.com`).

#### Option B: Hugging Face Spaces (Docker)
1. Create a new Space on [Hugging Face Spaces](https://huggingface.co/spaces).
2. Choose **Docker** as the SDK.
3. Push the `backend/` files and `backend/Dockerfile` to the repository.
4. Space will automatically build and expose the FastAPI endpoints.

---

### 2. Deploying the Frontend (Vercel)

1. Import your repository into [Vercel](https://vercel.com).
2. Set Build Settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. In Project Settings > Environment Variables, add:
   ```env
   VITE_BACKEND_URL=https://your-backend-service.onrender.com
   ```
4. Click **Deploy**.

---

## 💻 Local Development

### Unified Node & Express Dev Server
```bash
# Install dependencies
npm install

# Start full-stack local server (Vite + Express on port 3000)
npm run dev
```

### Or Standalone Python Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

---

## 🧪 Testing

Pure logic and aspect-ratio preservation are verified via Node's test runner:
```bash
npx --yes tsx --test src/utils/upscaleMath.test.ts
```
