import { expect, it } from 'vitest';
import { readDemoPhoto } from '../demo-photo';

it('reads a supported photo as a persistable data URL', async () => {
  const photo = new window.File(['photo'], 'before.png', { type: 'image/png' });
  expect(await readDemoPhoto(photo)).toMatch(/^data:image\/png;base64,/);
});

it('rejects unsupported files and enforces the exact 1 MB limit', async () => {
  await expect(readDemoPhoto(new window.File(['text'], 'file.svg', { type: 'image/svg+xml' }))).rejects.toThrow('JPEG, PNG, or WebP');
  const accepted = new window.File([new Uint8Array(1_000_000)], 'photo.png', { type: 'image/png' });
  await expect(readDemoPhoto(accepted)).resolves.toMatch(/^data:image\/png;base64,/);
  const oversized = new window.File([new Uint8Array(1_000_001)], 'photo.png', { type: 'image/png' });
  await expect(readDemoPhoto(oversized)).rejects.toThrow('under 1 MB');
});
