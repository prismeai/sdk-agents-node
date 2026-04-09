import { BaseResource } from '../../core/base-resource.js';
import type { HttpClient } from '../../core/http-client.js';
import type { PageIterator } from '../../core/pagination.js';
import { toFormData, mimeFromFilename, type FileInput, type FileUploadOptions } from '../../core/uploads.js';
import type { FileObject, FileUploadParams, FileListParams } from '../../types/storage/files.js';

export class Files extends BaseResource {
  private readonly workspaceId: string;

  constructor(httpClient: HttpClient, workspaceId: string) {
    super(httpClient);
    this.workspaceId = workspaceId;
  }

  private path(...segments: string[]): string {
    return this.buildPath(this.workspaceId, ...segments);
  }

  /** List files. */
  list(params?: FileListParams): PageIterator<FileObject> {
    return this._paginate<FileObject>(this.path('files'), params);
  }

  /** Upload a file. */
  async upload(file: FileInput, params?: FileUploadParams & FileUploadOptions): Promise<FileObject> {
    const filename = params?.filename ?? params?.name ?? 'file';
    const contentType = params?.contentType ?? mimeFromFilename(filename);
    const formData = await toFormData('file', file, { filename, contentType });

    if (params?.name) {
      formData.append('name', params.name);
    }
    if (params?.metadata) {
      formData.append('metadata', JSON.stringify(params.metadata));
    }

    return this.httpClient.post<FileObject>(this.path('files'), formData);
  }

  /** Get file metadata. */
  get(fileId: string): Promise<FileObject> {
    return this.httpClient.get<FileObject>(this.path('files', fileId));
  }

  /** Delete a file. */
  delete(fileId: string): Promise<void> {
    return this._del<void>(this.path('files', fileId));
  }

  /** Download a file. Returns the raw Response for streaming. */
  async download(fileId: string): Promise<Response> {
    return this.httpClient.requestRaw({
      method: 'GET',
      path: this.path('files', fileId, 'content'),
    });
  }
}
