/**
 * Sample image generators for instant testing without requiring external uploads.
 * Creates real Blob and File objects with sharp edges and textures.
 */

export function createSampleImageFile(type: 'skyline' | 'portrait' | 'macro' | 'emblem'): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    if (type === 'skyline') {
      canvas.width = 640;
      canvas.height = 420;
      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 420);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.7, '#1e293b');
      grad.addColorStop(1, '#334155');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 420);

      // Stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 60; i++) {
        const x = (i * 47) % 640;
        const y = (i * 29) % 200;
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      // Buildings with windows
      const buildings = [
        { x: 30, w: 70, h: 220, color: '#111827' },
        { x: 120, w: 90, h: 280, color: '#1f2937' },
        { x: 230, w: 80, h: 320, color: '#0f172a' },
        { x: 330, w: 100, h: 260, color: '#1e293b' },
        { x: 450, w: 75, h: 300, color: '#111827' },
        { x: 540, w: 80, h: 210, color: '#1f2937' },
      ];

      for (const b of buildings) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, 420 - b.h, b.w, b.h);
        // Windows
        ctx.fillStyle = '#fbbf24';
        for (let r = 420 - b.h + 15; r < 400; r += 20) {
          for (let c = b.x + 10; c < b.x + b.w - 10; c += 16) {
            if ((r + c) % 3 !== 0) {
              ctx.fillRect(c, r, 8, 10);
            }
          }
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('UPSCALE PRO · 640x420 ARCHITECTURE', 30, 40);

      canvas.toBlob((blob) => {
        resolve(new File([blob!], 'city_skyline_architecture.png', { type: 'image/png' }));
      }, 'image/png');
    } else if (type === 'portrait') {
      canvas.width = 512;
      canvas.height = 512;
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Geometric face silhouette
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(256, 210, 100, 0, Math.PI * 2);
      ctx.fill();

      // Sunglasses
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(190, 190, 55, 30);
      ctx.fillRect(267, 190, 55, 30);
      ctx.fillRect(245, 200, 22, 6);

      // Shoulders
      ctx.beginPath();
      ctx.ellipse(256, 440, 160, 100, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('HIGH-CONTRAST PORTRAIT (512x512)', 60, 50);

      canvas.toBlob((blob) => {
        resolve(new File([blob!], 'cyber_avatar_portrait.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.9);
    } else if (type === 'macro') {
      canvas.width = 600;
      canvas.height = 400;
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, 600, 400);

      // Intricate leaf vein patterns
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(300, 380);
      ctx.lineTo(300, 30);
      ctx.stroke();

      for (let y = 350; y > 50; y -= 35) {
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(300, y);
        ctx.quadraticCurveTo(200, y - 20, 120, y - 45);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(300, y);
        ctx.quadraticCurveTo(400, y - 20, 480, y - 45);
        ctx.stroke();
      }

      ctx.fillStyle = '#ecfdf5';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('BOTANICAL MACRO TEXTURE (600x400)', 40, 40);

      canvas.toBlob((blob) => {
        resolve(new File([blob!], 'botanical_leaf_macro.webp', { type: 'image/webp' }));
      }, 'image/webp', 0.95);
    } else {
      // Emblem
      canvas.width = 480;
      canvas.height = 480;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 480, 480);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, 400, 400);

      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(240, 240, 140, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.font = '900 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('UPSCALE', 240, 215);
      ctx.fillText('PRO', 240, 265);

      ctx.font = '600 13px monospace';
      ctx.fillText('LANCZOS-3 · 1200 DPI READY', 240, 305);

      canvas.toBlob((blob) => {
        resolve(new File([blob!], 'typography_emblem_vector.png', { type: 'image/png' }));
      }, 'image/png');
    }
  });
}
