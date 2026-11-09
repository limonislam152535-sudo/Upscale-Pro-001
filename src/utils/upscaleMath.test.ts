import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTargetDimensions,
  calculatePrintDimensions,
  formatBytes,
  validateImageFile,
  getDpiPresetDetails,
} from './upscaleMath';

test('calculateTargetDimensions scales 765x1024 at 2X to exact 1530x2048', () => {
  const result = calculateTargetDimensions(765, 1024, 2);
  assert.equal(result.width, 1530);
  assert.equal(result.height, 2048);
  assert.equal(result.scaleFactor, 2);
  // aspect ratio remains intact: 765/1024 = 0.7471
  assert.equal(Number((765 / 1024).toFixed(4)), result.aspectRatio);
});

test('calculateTargetDimensions scales 1920x1080 at 3X, 4X, 8X, and 16X (MAX) accurately', () => {
  const res3x = calculateTargetDimensions(1920, 1080, 3);
  assert.equal(res3x.width, 5760);
  assert.equal(res3x.height, 3240);

  const res4x = calculateTargetDimensions(1920, 1080, 4);
  assert.equal(res4x.width, 7680);
  assert.equal(res4x.height, 4320);
  assert.equal(res4x.totalMegapixels, 33.18);

  // 8X of 1920x1080 = 15360x8640 (within 16384 ceiling)
  const res8x = calculateTargetDimensions(1920, 1080, 8);
  assert.equal(res8x.width, 15360);
  assert.equal(res8x.height, 8640);

  // 16X of 765x1024 = 12240x16384 (full uncompressed 16X)
  const res16x = calculateTargetDimensions(765, 1024, 16);
  assert.equal(res16x.width, 12240);
  assert.equal(res16x.height, 16384);
});

test('calculateTargetDimensions throws on non-positive input dimensions', () => {
  assert.throws(() => calculateTargetDimensions(0, 100, 2), /Image dimensions must be positive/);
  assert.throws(() => calculateTargetDimensions(100, -5, 4), /Image dimensions must be positive/);
});

test('calculatePrintDimensions computes correct physical inches and cm for 300 DPI', () => {
  // 3000 x 2400 pixels at 300 DPI = 10" x 8"
  const printSize = calculatePrintDimensions(3000, 2400, 300);
  assert.equal(printSize.widthInches, 10);
  assert.equal(printSize.heightInches, 8);
  assert.equal(printSize.widthCm, 25.4);
  assert.equal(printSize.heightCm, 20.3);
});

test('formatBytes formats bytes correctly across units', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(1048576 * 2.5), '2.5 MB');
});

test('validateImageFile accepts valid formats and rejects invalid ones', () => {
  assert.equal(validateImageFile({ name: 'photo.jpg', size: 102400 }).valid, true);
  assert.equal(validateImageFile({ name: 'graphic.PNG', size: 204800 }).valid, true);
  assert.equal(validateImageFile({ name: 'art.webp', size: 50000 }).valid, true);

  const invalidExt = validateImageFile({ name: 'script.exe', size: 1000 });
  assert.equal(invalidExt.valid, false);
  assert.match(invalidExt.error || '', /Unsupported format/);

  const tooLarge = validateImageFile({ name: 'huge.jpg', size: 60 * 1024 * 1024 });
  assert.equal(tooLarge.valid, false);
  assert.match(tooLarge.error || '', /exceeds 50MB/);

  const emptyFile = validateImageFile({ name: 'zero.jpg', size: 0 });
  assert.equal(emptyFile.valid, false);
  assert.match(emptyFile.error || '', /empty or corrupted/);
});

test('getDpiPresetDetails returns accurate metadata for all presets', () => {
  const dpi300 = getDpiPresetDetails(300);
  assert.match(dpi300.label, /300 DPI/);
  assert.match(dpi300.bestFor, /Photo books/);

  const dpi1200 = getDpiPresetDetails(1200);
  assert.match(dpi1200.label, /1200 DPI/);
  assert.match(dpi1200.bestFor, /Archival/);
});
