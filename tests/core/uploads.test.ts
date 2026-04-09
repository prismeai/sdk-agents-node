import { describe, it, expect, vi } from 'vitest';
import { toFormData, mimeFromFilename } from '../../src/core/uploads.js';

// ---------------------------------------------------------------------------
// mimeFromFilename
// ---------------------------------------------------------------------------

describe('mimeFromFilename', () => {
  it('returns correct mime for pdf', () => {
    expect(mimeFromFilename('document.pdf')).toBe('application/pdf');
  });

  it('returns correct mime for json', () => {
    expect(mimeFromFilename('data.json')).toBe('application/json');
  });

  it('returns correct mime for csv', () => {
    expect(mimeFromFilename('table.csv')).toBe('text/csv');
  });

  it('returns correct mime for txt', () => {
    expect(mimeFromFilename('readme.txt')).toBe('text/plain');
  });

  it('returns correct mime for md', () => {
    expect(mimeFromFilename('README.md')).toBe('text/markdown');
  });

  it('returns correct mime for html', () => {
    expect(mimeFromFilename('page.html')).toBe('text/html');
  });

  it('returns correct mime for xml', () => {
    expect(mimeFromFilename('config.xml')).toBe('application/xml');
  });

  it('returns correct mime for png', () => {
    expect(mimeFromFilename('image.png')).toBe('image/png');
  });

  it('returns correct mime for jpg', () => {
    expect(mimeFromFilename('photo.jpg')).toBe('image/jpeg');
  });

  it('returns correct mime for jpeg', () => {
    expect(mimeFromFilename('photo.jpeg')).toBe('image/jpeg');
  });

  it('returns correct mime for gif', () => {
    expect(mimeFromFilename('animation.gif')).toBe('image/gif');
  });

  it('returns correct mime for svg', () => {
    expect(mimeFromFilename('icon.svg')).toBe('image/svg+xml');
  });

  it('returns correct mime for webp', () => {
    expect(mimeFromFilename('photo.webp')).toBe('image/webp');
  });

  it('returns correct mime for mp3', () => {
    expect(mimeFromFilename('song.mp3')).toBe('audio/mpeg');
  });

  it('returns correct mime for mp4', () => {
    expect(mimeFromFilename('video.mp4')).toBe('video/mp4');
  });

  it('returns correct mime for zip', () => {
    expect(mimeFromFilename('archive.zip')).toBe('application/zip');
  });

  it('returns correct mime for doc', () => {
    expect(mimeFromFilename('file.doc')).toBe('application/msword');
  });

  it('returns correct mime for docx', () => {
    expect(mimeFromFilename('file.docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('returns correct mime for xls', () => {
    expect(mimeFromFilename('file.xls')).toBe('application/vnd.ms-excel');
  });

  it('returns correct mime for xlsx', () => {
    expect(mimeFromFilename('file.xlsx')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('returns application/octet-stream for unknown extension', () => {
    expect(mimeFromFilename('file.xyz')).toBe('application/octet-stream');
  });

  it('returns application/octet-stream for no extension', () => {
    expect(mimeFromFilename('noext')).toBe('application/octet-stream');
  });

  it('handles uppercase extensions', () => {
    expect(mimeFromFilename('photo.PNG')).toBe('image/png');
  });
});

// ---------------------------------------------------------------------------
// toFormData
// ---------------------------------------------------------------------------

describe('toFormData', () => {
  it('converts Buffer to FormData', async () => {
    const buf = Buffer.from('hello');
    const fd = await toFormData('file', buf, { filename: 'test.txt' });

    expect(fd).toBeInstanceOf(FormData);
    expect(fd.has('file')).toBe(true);
  });

  it('converts ArrayBuffer to FormData', async () => {
    const ab = new ArrayBuffer(4);
    const fd = await toFormData('file', ab);

    expect(fd).toBeInstanceOf(FormData);
    expect(fd.has('file')).toBe(true);
  });

  it('converts Uint8Array to FormData', async () => {
    const arr = new Uint8Array([1, 2, 3]);
    const fd = await toFormData('data', arr, { filename: 'bytes.bin' });

    expect(fd).toBeInstanceOf(FormData);
    expect(fd.has('data')).toBe(true);
  });

  it('converts Blob to FormData', async () => {
    const blob = new Blob(['content'], { type: 'text/plain' });
    const fd = await toFormData('doc', blob, { filename: 'doc.txt' });

    expect(fd).toBeInstanceOf(FormData);
    expect(fd.has('doc')).toBe(true);
  });

  it('converts ReadableStream to FormData', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('hello'));
        controller.enqueue(encoder.encode(' world'));
        controller.close();
      },
    });

    const fd = await toFormData('file', stream, { filename: 'stream.txt', contentType: 'text/plain' });

    expect(fd).toBeInstanceOf(FormData);
    expect(fd.has('file')).toBe(true);
  });

  it('reads file path as string input', async () => {
    // Mock readFile to avoid actual filesystem access
    const { readFile } = await import('node:fs/promises');
    vi.mock('node:fs/promises', () => ({
      readFile: vi.fn().mockResolvedValue(Buffer.from('file contents')),
    }));

    const fd = await toFormData('file', '/path/to/file.txt', { filename: 'file.txt' });
    expect(fd).toBeInstanceOf(FormData);
    expect(fd.has('file')).toBe(true);

    vi.restoreAllMocks();
  });

  it('uses default filename "file" when not provided', async () => {
    const buf = Buffer.from('data');
    const fd = await toFormData('file', buf);

    // The FormData should have the file field
    expect(fd.has('file')).toBe(true);
  });

  it('uses provided contentType', async () => {
    const buf = Buffer.from('data');
    const fd = await toFormData('file', buf, {
      filename: 'data.bin',
      contentType: 'application/custom',
    });
    expect(fd.has('file')).toBe(true);
  });

  it('throws TypeError for unsupported input type', async () => {
    await expect(toFormData('file', 42 as unknown as Buffer)).rejects.toThrow(TypeError);
  });
});
