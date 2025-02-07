// EDGAR Daily Summary types
export interface EdgarDailySummaryDirectoryItem {
  name: string;
  size: string;
  'last-modified': string;
  type: 'dir' | 'file';
  href: string;
}

export interface EdgarDailySummaryDirectory {
  name: string;
  'parent-dir': string;
  item: EdgarDailySummaryDirectoryItem[];
}

export interface EdgarDailySummaryApiResponse {
  directory: EdgarDailySummaryDirectory;
}

// EDGAR IDX file parser type
export interface EdgarIdxFileEntry {
  cik: string;
  company: string;
  formType: string;
  dateFiled: Date;
  filename: string;
  filingId: string;
  action: 'create' | 'update' | 'skip' | null;
}

// embedded document types
export interface EdgarEmbeddedDocument {
  type: string | null;
  sequence: number | null;
  description: string | null;
  fileName: string | null;
  format: 'xml' | 'pdf' | 'xrbl' | 'other';
  rawContent: string;
  size: number;
}
