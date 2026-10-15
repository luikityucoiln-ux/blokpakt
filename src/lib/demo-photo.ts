export function readDemoPhoto(file: globalThis.File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return Promise.reject(new Error('Choose a JPEG, PNG, or WebP photo.'));
  }
  if (file.size > 1_000_000) {
    return Promise.reject(new Error('Choose a photo under 1 MB for this browser-only demo.'));
  }
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Could not read this photo. Please try another file.'));
    reader.onerror = () => reject(new Error('Could not read this photo. Please try again.'));
    reader.onabort = () => reject(new Error('Photo reading was cancelled.'));
    reader.readAsDataURL(file);
  });
}
