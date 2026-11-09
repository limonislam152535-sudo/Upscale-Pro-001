import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import * as archiverModule from 'archiver';
import { fileURLToPath } from 'url';
import { calculateTargetDimensions, ScaleFactor, OutputFormat, DpiValue } from './src/utils/upscaleMath';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust archiver factory supporting Archiver v8 (ESM ZipArchive) and earlier versions
function createZipArchive(options: any = { zlib: { level: 5 } }) {
  const mod = archiverModule as any;
  if (typeof mod.ZipArchive === 'function') {
    return new mod.ZipArchive(options);
  }
  if (typeof mod.default === 'function') {
    return mod.default('zip', options);
  }
  if (typeof mod === 'function') {
    return mod('zip', options);
  }
  throw new Error('Archiver initialization failed: no valid zip archive class found');
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Temporary directories for processing and zip storage
const UPLOADS_DIR = '/tmp/upscale_pro/uploads';
const PROCESSED_DIR = '/tmp/upscale_pro/processed';

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(PROCESSED_DIR, { recursive: true });

// Auto-cleanup helper for files older than 2 hours
function cleanupOldFiles() {
  const maxAgeMs = 2 * 60 * 60 * 1000;
  const now = Date.now();
  for (const dir of [UPLOADS_DIR, PROCESSED_DIR]) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
        }
      }
    } catch {
      // ignore cleanup errors
    }
  }
}
setInterval(cleanupOldFiles, 30 * 60 * 1000);

// Multer memory storage (keeps server fast and avoids disk thrashing for medium images)
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 200,
  },
  fileFilter: (_req, file, cb) => {
    const isImage =
      (file.mimetype && file.mimetype.startsWith('image/')) ||
      Boolean(file.originalname.match(/\.(jpe?g|png|webp|jfif|avif)$/i));
    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error('Please upload an image file (JPG, PNG, or WEBP).'));
    }
  },
});

app.use(express.json());

// API: Health check & Engine Telemetry
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    engine: 'Lanczos3 Server-Side Resampling Kernel',
    clientLoad: '0% (Strict Cloud Processing)',
    dpiInjection: 'Enabled (JFIF/EXIF/PNG pHYs headers)',
    formatsSupported: ['jpeg', 'png', 'webp'],
    maxScale: '16X (MAX)',
    timestamp: new Date().toISOString(),
  });
});

// API: Single Image Upscaling Endpoint
app.post('/api/upscale', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file uploaded.' });
      return;
    }

    const scaleFactor = (Number(req.body.scaleFactor) || 2) as ScaleFactor;
    const format = ((req.body.format || 'png') as string).toLowerCase() as OutputFormat;
    const quality = Math.min(100, Math.max(70, Number(req.body.quality) || 90));
    const dpi = (Number(req.body.dpi) || 300) as DpiValue;

    if (![2, 3, 4, 8, 16].includes(scaleFactor)) {
      res.status(400).json({ error: 'scaleFactor must be 2, 3, 4, 8, or 16 (MAX)' });
      return;
    }

    // Inspect original image dimensions via Sharp
    const imagePipeline = sharp(req.file.buffer);
    const metadata = await imagePipeline.metadata();

    if (!metadata.width || !metadata.height) {
      res.status(400).json({ error: 'Unable to decode image dimensions.' });
      return;
    }

    // Accurate Lanczos pixel scaling
    const target = calculateTargetDimensions(metadata.width, metadata.height, scaleFactor);

    // Prepare Sharp Lanczos-3 pipeline with relaxed pixel limit for 16X UHD Master scaling
    let pipeline = sharp(req.file.buffer, { failOn: 'none', limitInputPixels: false }).resize({
      width: target.width,
      height: target.height,
      kernel: sharp.kernel.lanczos3,
      fit: 'fill',
    });

    // Embed Target DPI in headers (EXIF, JFIF, PNG pHYs density)
    pipeline = pipeline.withMetadata({ density: dpi });

    // Format & Quality Encoding
    let ext: string = format;
    if (format === 'jpeg') {
      ext = 'jpg';
      pipeline = pipeline.flatten({ background: '#ffffff' }).jpeg({
        quality,
        mozjpeg: true,
        chromaSubsampling: '4:4:4',
      });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({
        quality,
        effort: 4,
        lossless: quality === 100,
      });
    } else {
      // PNG: for 8X and 16X (MAX), use light compression (level 2) to preserve massive, rich uncompressed file size and execute within seconds
      pipeline = pipeline.png({
        compressionLevel: scaleFactor >= 8 ? 2 : 5,
        adaptiveFiltering: false,
      });
    }

    const baseName = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const generatedFilename = `upscale_pro_${baseName}_${scaleFactor}x_${dpi}dpi_${Date.now()}.${ext}`;
    const destinationPath = path.join(PROCESSED_DIR, generatedFilename);

    await pipeline.toFile(destinationPath);
    const processedStats = fs.statSync(destinationPath);

    res.json({
      success: true,
      id: generatedFilename,
      filename: generatedFilename,
      originalName: req.file.originalname,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      newWidth: target.width,
      newHeight: target.height,
      scaleFactor,
      originalSize: req.file.size,
      newSize: processedStats.size,
      format,
      quality,
      dpi,
      downloadUrl: `/api/download/${generatedFilename}`,
    });
  } catch (error: any) {
    console.error('Upscale server error:', error);
    res.status(500).json({ error: error.message || 'Server image processing failed.' });
  }
});

// API: File Download & Inline Preview Endpoint (Safe from path traversal)
app.get('/api/download/:filename', (req: Request, res: Response): void => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(PROCESSED_DIR, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Processed file not found or expired.' });
      return;
    }

    if (req.query.inline === 'true') {
      res.sendFile(filePath);
    } else {
      res.download(filePath, filename);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'File download failed.' });
  }
});

// API: Batch ZIP Archive Generation & Download
app.post('/api/zip-download', async (req: Request, res: Response): Promise<void> => {
  try {
    const files: string[] = req.body.filenames;
    if (!Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: 'No filenames provided for ZIP generation.' });
      return;
    }

    const zipFilename = `upscale_pro_batch_${Date.now()}.zip`;
    res.attachment(zipFilename);
    res.setHeader('Content-Type', 'application/zip');

    const archive = createZipArchive({
      zlib: { level: 5 },
    });

    archive.on('error', (err: any) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'ZIP creation failed.' });
      }
    });

    archive.pipe(res);

    for (const rawName of files) {
      const safeName = path.basename(rawName);
      const filePath = path.join(PROCESSED_DIR, safeName);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: safeName });
      }
    }

    await archive.finalize();
  } catch (error: any) {
    console.error('ZIP error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'ZIP failed' });
    }
  }
});

// Dedicated API error handling middleware to ensure /api routes ALWAYS return JSON, never HTML
app.use('/api', (err: any, _req: Request, res: Response, _next: any) => {
  console.error('Caught API error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'File size exceeds maximum 50MB limit.' });
    return;
  }
  res.status(err.status || 400).json({
    error: err.message || 'Image processing error occurred.'
  });
});

// Launch server with Vite middleware in development
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Upscale Pro server running at http://0.0.0.0:${PORT}`);
  });
}

start();
