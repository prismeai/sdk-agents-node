import { readFile } from 'node:fs/promises';

/**
 * Supported input types for file uploads.
 */
export type FileInput =
  | Buffer
  | ArrayBuffer
  | Uint8Array
  | ReadableStream
  | Blob
  | string; // file path

export interface FileUploadOptions {
  filename?: string;
  contentType?: string;
}

/**
 * Convert various file input types to FormData for upload.
 */
export async function toFormData(
  fieldName: string,
  input: FileInput,
  options: FileUploadOptions = {},
): Promise<FormData> {
  const formData = new FormData();
  const blob = await toBlob(input, options);
  formData.append(fieldName, blob, options.filename ?? 'file');
  return formData;
}

async function toBlob(input: FileInput, options: FileUploadOptions): Promise<Blob> {
  const contentType = options.contentType ?? 'application/octet-stream';

  if (input instanceof Blob) {
    return input;
  }

  if (typeof input === 'string') {
    // Treat as file path
    const data = await readFile(input);
    return new Blob([data], { type: contentType });
  }

  if (input instanceof Buffer || input instanceof ArrayBuffer || input instanceof Uint8Array) {
    return new Blob([input], { type: contentType });
  }

  if (input instanceof ReadableStream) {
    const chunks: Uint8Array[] = [];
    const reader = input.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return new Blob(chunks, { type: contentType });
  }

  throw new TypeError(`Unsupported file input type: ${typeof input}`);
}

/**
 * Detect MIME type from filename extension.
 */
export function mimeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    json: 'application/json',
    csv: 'text/csv',
    txt: 'text/plain',
    md: 'text/markdown',
    html: 'text/html',
    xml: 'application/xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    zip: 'application/zip',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
}
