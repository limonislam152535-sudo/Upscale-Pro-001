"""
Upscale Pro - Cloud-Based AI Image Upscaling Backend
FastAPI + Pillow (LANCZOS Resampling) with Header DPI Injection
"""

import os
import io
import time
import zipfile
import shutil
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from PIL import Image

app = FastAPI(
    title="Upscale Pro API",
    description="High-performance cloud-based image upscaling with LANCZOS resampling, DPI metadata injection, and zero client CPU load.",
    version="1.0.0"
)

# CORS middleware for Vercel / frontend client connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "/tmp/upscale_pro"
PROCESSED_DIR = os.path.join(TEMP_DIR, "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

def cleanup_old_files():
    """Background task to remove temporary files older than 2 hours."""
    now = time.time()
    cutoff = now - 7200
    try:
        for fname in os.listdir(PROCESSED_DIR):
            fpath = os.path.join(PROCESSED_DIR, fname)
            if os.path.isfile(fpath) and os.path.getmtime(fpath) < cutoff:
                os.remove(fpath)
    except Exception as e:
        print(f"Cleanup error: {e}")

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "engine": "Python Pillow (PIL.Image.Resampling.LANCZOS)",
        "client_load": "0% (All calculations executed on server)",
        "supported_factors": [2, 4, 8],
        "supported_dpis": [72, 150, 300, 600, 1200],
        "supported_formats": ["JPEG", "PNG", "WEBP"]
    }

@app.post("/api/upscale")
async def upscale_image(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    scaleFactor: int = Form(2),
    format: str = Form("png"),
    quality: int = Form(90),
    dpi: int = Form(300)
):
    # Validate inputs
    if scaleFactor not in [2, 3, 4, 8, 16]:
        raise HTTPException(status_code=400, detail="scaleFactor must be 2, 3, 4, 8, or 16 (MAX).")
    
    fmt = format.lower()
    if fmt not in ["jpeg", "jpg", "png", "webp"]:
        raise HTTPException(status_code=400, detail="Format must be JPEG, PNG, or WEBP.")
    
    quality = max(70, min(100, quality))
    valid_dpis = [72, 150, 300, 600, 1200]
    target_dpi = dpi if dpi in valid_dpis else 300

    try:
        contents = await image.read()
        if len(contents) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 50MB limit.")

        img = Image.open(io.BytesIO(contents))
        orig_width, orig_height = img.size

        # 100% strict Aspect Ratio scaling using LANCZOS resampling
        new_width = round(orig_width * scaleFactor)
        new_height = round(orig_height * scaleFactor)

        # Safety ceiling: 16384px (16K Master Print standard) allowing true 16X scaling on standard images
        MAX_DIM = 16384
        if new_width > MAX_DIM or new_height > MAX_DIM:
            ratio = min(MAX_DIM / new_width, MAX_DIM / new_height)
            new_width = round(new_width * ratio)
            new_height = round(new_height * ratio)

        # High-fidelity Lanczos resampling
        upscaled_img = img.resize((new_width, new_height), resample=Image.Resampling.LANCZOS)

        # Normalize format string for Pillow
        save_format = "JPEG" if fmt in ["jpg", "jpeg"] else fmt.upper()
        ext = "jpg" if save_format == "JPEG" else save_format.lower()

        # Handle RGBA to RGB conversion for JPEG
        if save_format == "JPEG" and upscaled_img.mode in ("RGBA", "LA", "P"):
            upscaled_img = upscaled_img.convert("RGB")

        # Sanitize filename
        clean_base = os.path.splitext(image.filename or "image")[0]
        clean_base = "".join(c for c in clean_base if c.isalnum() or c in ("-", "_"))
        out_filename = f"upscale_pro_{clean_base}_{scaleFactor}x_{target_dpi}dpi_{int(time.time()*1000)}.{ext}"
        out_path = os.path.join(PROCESSED_DIR, out_filename)

        # Save with DPI header metadata embedding
        save_kwargs = {
            "dpi": (target_dpi, target_dpi)
        }
        if save_format == "JPEG":
            save_kwargs["quality"] = quality
            save_kwargs["optimize"] = True
            save_kwargs["subsampling"] = 0  # 4:4:4 chroma subsampling for max crispness
        elif save_format == "WEBP":
            save_kwargs["quality"] = quality
            save_kwargs["lossless"] = (quality == 100)
            save_kwargs["method"] = 6
        elif save_format == "PNG":
            save_kwargs["optimize"] = True

        upscaled_img.save(out_path, format=save_format, **save_kwargs)
        new_size = os.path.getsize(out_path)

        # Queue background cleanup of stale files
        background_tasks.add_task(cleanup_old_files)

        return {
            "success": True,
            "id": out_filename,
            "filename": out_filename,
            "originalName": image.filename,
            "originalWidth": orig_width,
            "originalHeight": orig_height,
            "newWidth": new_width,
            "newHeight": new_height,
            "scaleFactor": scaleFactor,
            "originalSize": len(contents),
            "newSize": new_size,
            "format": fmt,
            "quality": quality,
            "dpi": target_dpi,
            "downloadUrl": f"/api/download/{out_filename}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@app.get("/api/download/{filename}")
async def download_file(filename: str, inline: bool = False):
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(PROCESSED_DIR, safe_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found or expired.")
    if inline:
        ext = os.path.splitext(safe_filename)[1].lower()
        media_type = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"
        return FileResponse(file_path, media_type=media_type)
    return FileResponse(file_path, filename=safe_filename, media_type="application/octet-stream")

@app.post("/api/zip-download")
async def zip_download(filenames: List[str]):
    if not filenames:
        raise HTTPException(status_code=400, detail="No filenames provided.")

    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        for fname in filenames:
            safe_fname = os.path.basename(fname)
            fpath = os.path.join(PROCESSED_DIR, safe_fname)
            if os.path.exists(fpath):
                zip_file.write(fpath, arcname=safe_fname)

    zip_io.seek(0)
    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=upscale_pro_batch_{int(time.time())}.zip"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
