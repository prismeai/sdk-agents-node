export interface FileObject {
  id: string;
  name: string;
  url: string;
  mimetype: string;
  size: number;
  workspaceId: string;
  /** Storage key, `<workspaceId>/<id>.<name>`. */
  path: string;
  metadata?: Record<string, unknown>;
  public?: boolean;
  expiresAt?: string | null;
  [key: string]: unknown;
}

export interface FileUploadParams {
  metadata?: Record<string, unknown>;
}
