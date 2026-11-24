export type DocumentKind = "files" | "skills";

export interface FeatureSummary {
  /** The folder name. */
  name: string;
  /** The `#` heading of spec.md, or null. */
  title: string | null;
  /** From the feature's README.md front matter, or null. */
  status: string | null;
  owner: string | null;
  preview: string | null;
  /** When work began, from the README front matter `started`. Null when not set. */
  started: string | null;
  /** When it shipped, from the README front matter `shipped`. Null means still open. */
  shipped: string | null;
}

export interface DocumentEntry {
  kind: DocumentKind;
  /** Short name used in routes: "product" for product/product.md, "spec-from-prd" for a skill. */
  name: string;
  /** Path relative to the design/ folder, with forward slashes. */
  path: string;
  /** The front matter `description`, else the first heading, else the first line. */
  description: string | null;
  /** The front matter `description` alone. Null when the file declares none. */
  declaredDescription: string | null;
}

export interface ReadResult {
  path: string;
  exists: boolean;
  text: string;
  /** File modified time in ms since epoch; pass it back to writeDocument as `loadedAt`. */
  modifiedAt: number | null;
}

export type WriteResult =
  | { ok: true; modifiedAt: number }
  | {
      ok: false;
      reason: "conflict" | "missing";
      /** The file's current modified time, if it still exists. */
      modifiedAt: number | null;
      message: string;
    };

export interface JsonRead {
  exists: boolean;
  data: unknown;
  /** Parse error message when the file exists but is not valid JSON. */
  error: string | null;
}

export interface VariantFile {
  /** Relative to the feature's variants/ folder, with forward slashes. */
  path: string;
  type: "file" | "dir";
  size: number;
}

export interface Feature extends FeatureSummary {
  exists: boolean;
  spec: ReadResult;
  strings: JsonRead;
  variants: JsonRead;
  variantFiles: VariantFile[];
  /** Variant ids that have design/prototype/<id>/index.html, so their own page can open. */
  prototypes: string[];
}

export interface RepoStatus {
  /** False when the folder is not in a Git repository, or Git is not installed. */
  available: boolean;
  branch: string | null;
  /** True when nothing under design/ has uncommitted changes. Null when unavailable. */
  clean: boolean | null;
  /** `git status --porcelain` lines, limited to design/. */
  changed: string[];
}

export interface DataLayer {
  listFeatures(): Promise<FeatureSummary[]>;
  listDocuments(kind: DocumentKind): Promise<DocumentEntry[]>;
  readDocument(path: string): Promise<ReadResult>;
  writeDocument(path: string, content: string, loadedAt: number | null): Promise<WriteResult>;
  readFeature(name: string): Promise<Feature>;
  repoStatus(): Promise<RepoStatus>;
}
