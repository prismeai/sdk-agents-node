import { basename } from 'node:path';
import { BaseResource } from '../../core/base-resource.js';
import { PrismeAIError } from '../../core/errors.js';
import type { HttpClient } from '../../core/http-client.js';
import { toFormData, mimeFromFilename, type FileInput, type FileUploadOptions } from '../../core/uploads.js';
import type { FileObject, FileUploadParams } from '../../types/storage/files.js';
import type { DeleteResult } from '../../types/storage/knowledge-bases.js';

/**
 * Native files of the storage workspace. Attach an uploaded file to a knowledge base
 * with `knowledgeBases.documents.add(kbId, { native_file_id: file.id })`.
 */
export class Files extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return ['/workspaces', `slug:${this.workspaceId}`, 'files', ...segments].join('/');
  }

  /**
   * Upload a private file. Without `contentType`, a Blob's own type is used, else the filename's
   * extension (the path's basename by default).
   */
  async upload(file: FileInput, params?: FileUploadParams & FileUploadOptions): Promise<FileObject> {
    const filename = params?.filename ?? defaultFilename(file);
    const contentType = params?.contentType || (file instanceof Blob && file.type) || mimeFromFilename(filename);
    const formData = await toFormData('file', file, { filename, contentType });
    formData.append('public', 'false');
    if (params?.metadata) {
      formData.append('metadata', JSON.stringify(params.metadata));
    }

    const [uploaded] = await this._post<FileObject[]>(this.path(), formData);
    if (!uploaded) {
      throw new PrismeAIError('File upload returned no file');
    }
    return uploaded;
  }

  /** Get file metadata. */
  get(fileId: string): Promise<FileObject> {
    return this._get<FileObject>(this.path(fileId));
  }

  /**
   * Delete a file you uploaded that no document uses, e.g. after `documents.add` refused it.
   * 409 while a document uses it: delete the document instead, which deletes the file with it.
   */
  delete(fileId: string): Promise<DeleteResult> {
    return this._del<DeleteResult>(this.buildPath(this.workspaceId, 'files', fileId));
  }

  /** Download a file's content. Returns the raw Response for streaming. */
  async download(fileId: string): Promise<Response> {
    const { path } = await this.get(fileId);
    // Resolved against the client's own baseURL so credentials never go to the host named in `url`.
    return this.httpClient.requestRaw({
      method: 'GET',
      path: `/files/${path.split('/').map(encodeURIComponent).join('/')}`,
    });
  }
}

function defaultFilename(file: FileInput): string {
  if (typeof file === 'string') return basename(file);
  if (file instanceof Blob && 'name' in file && typeof file.name === 'string') return file.name;
  return 'file';
}
