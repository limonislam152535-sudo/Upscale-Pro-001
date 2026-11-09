/**
 * Reliable binary file downloader for Web, iframe, and sandboxed environments.
 * Uses fetch + Blob URL to guarantee real, uncorrupted binary downloads with exact byte length.
 */
export async function downloadImageBlob(url: string, filename: string): Promise<void> {
  try {
    // Fetch the binary stream from the server
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Create hidden anchor and trigger download
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = blobUrl;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();

    // Cleanup object URL after download initiates
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (error) {
    console.error('Download error:', error);
    // Direct navigation fallback if blob fetch fails
    const fallbackAnchor = document.createElement('a');
    fallbackAnchor.href = url;
    fallbackAnchor.download = filename;
    fallbackAnchor.target = '_blank';
    fallbackAnchor.rel = 'noopener noreferrer';
    document.body.appendChild(fallbackAnchor);
    fallbackAnchor.click();
    setTimeout(() => document.body.removeChild(fallbackAnchor), 1000);
  }
}

/**
 * Downloads a binary Blob object directly to the user's computer with exact bytes.
 * Sandboxed-iframe friendly.
 */
export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = blobUrl;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(blobUrl);
  }, 2000);
}
