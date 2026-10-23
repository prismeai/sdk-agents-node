import { basename } from 'node:path';
import { BaseResource } from '../../core/base-resource.js';
import { PrismeAIError } from '../../core/errors.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import { toFormData, mimeFromFilename, type FileInput, type FileUploadOptions } from '../../core/uploads.js';
import type { FileObject, FileUploadParams, FileListParams } from '../../types/storage/files.js';

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

  /** List the workspace's files. Requires management rights on the storage workspace. */
  list(params?: FileListParams): PageIterator<FileObject> {
    // The endpoint returns a bare array and counts pages from 0: keep paging while pages come back full.
    return this._paginate<FileObject>(this.path(), params, { page: params?.page ?? 0 }, (body) => ({
      data: body as FileObject[],
    }));
  }

  /**
   * Upload a private file. The filename (the path's basename by default) sets the type
   * when `contentType` is not given: pass one for in-memory content.
   */
  async upload(file: FileInput, params?: FileUploadParams & FileUploadOptions): Promise<FileObject> {
    const filename = params?.filename ?? defaultFilename(file);
    const contentType = params?.contentType ?? mimeFromFilename(filename);
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

  /** Delete a file. Requires management rights on the storage workspace. */
  delete(fileId: string): Promise<void> {
    return this._del<void>(this.path(fileId));
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
