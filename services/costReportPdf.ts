import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '@/lib/domain';
import { getAuthHeaders } from '@/utils/axiosConfig';

// Cost Summary reports are made on the server (POST /api/cost-report-pdf, with
// headless Chrome) and saved on the phone. Phones used to print them with
// expo-print, and on Android its renderer could stall for good, leaving the
// "Generating…" spinner running.

export type CostReportType = 'material' | 'equipment' | 'other' | 'contractor';

/** The report couldn't be made; the message says why, for the screen to show. */
export class ReportRequestError extends Error {}

/** The person cancelled while the report was being made. */
export class ReportCancelledError extends Error {}

/** What createCostReport is doing, for the screen to show. */
export type ReportStage = 'collecting' | 'building' | 'downloading' | 'saving';

export interface CostReportRequest {
  type: CostReportType;
  projectName: string;
  generatedBy: string;
  /** Lets the server print the company name in the header. */
  clientId?: string | null;
  /** The records shown on the Cost Summary screen for this category. */
  rows: any[];
  /** Called as each stage starts. */
  onStage?: (stage: ReportStage) => void;
  /** Aborting it cancels the request; createCostReport then throws ReportCancelledError. */
  signal?: AbortSignal;
}

export interface SavedReport {
  uri: string;
  fileName: string;
  sizeBytes: number;
}

// The server prints a report in a few seconds; this covers a cold start and a slow network.
const REQUEST_TIMEOUT_MS = 90_000;

// Only what the printed report shows, so the request stays small.
const slimRow: Record<CostReportType, (row: any) => object> = {
  material: (m) => ({
    name: m.name,
    unit: m.unit,
    specs: m.specs,
    totalImported: m.totalImported,
    totalUsed: m.totalUsed,
    currentlyAvailable: m.currentlyAvailable,
    perUnitCost: m.perUnitCost,
    totalCost: m.totalCost,
    vendors: m.vendors,
  }),
  equipment: (e) => ({
    type: e.type,
    category: e.category,
    quantity: e.quantity,
    perUnitCost: e.perUnitCost,
    totalCost: e.totalCost,
    costType: e.costType,
    rentalPeriod: e.rentalPeriod,
    rentalDuration: e.rentalDuration,
    specifications: e.specifications,
    notes: e.notes,
    createdAt: e.createdAt,
    usageDate: e.usageDate,
  }),
  other: (o) => ({
    title: o.title || o.name,
    category: o.category,
    description: o.description,
    amount: o.amount,
    addedAt: o.addedAt || o.createdAt,
  }),
  contractor: (c) => {
    const s = c.staffId;
    const name = s && typeof s === 'object' ? [s.firstName, s.lastName].filter(Boolean).join(' ') : '';
    return {
      name: name || 'Contractor',
      contractType: c.contractType,
      totalAmount: c.totalAmount,
      totalPaid: c.totalPaid,
      payments: (c.payments || []).map((p: any) => ({
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentType: p.paymentType,
        notes: p.notes,
      })),
    };
  },
};

/** The server's reason for a failed request, if it gave one. */
async function serverError(res: Response): Promise<string | null> {
  try {
    const body = await res.json();
    if (__DEV__) console.warn(`[Report PDF] server answered ${res.status}:`, body?.detail ?? body?.error);
    return typeof body?.error === 'string' && body.error ? body.error : null;
  } catch {
    if (__DEV__) console.warn(`[Report PDF] server answered ${res.status} without a JSON body`);
    return null;
  }
}

const reportsDir = () => new Directory(Paths.document, 'reports');

/**
 * "Lotus_plaza_2026-10-29.pdf" -> "Lotus_plaza_2026-10-29_18-34-05.pdf".
 * Each report gets its own name: PDF viewers cache by file name and link, so
 * re-using one name showed an earlier copy of the report instead of the new one.
 */
const withTimeStamp = (name: string) => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `${name.replace(/\.pdf$/i, '')}_${time}.pdf`;
};

interface PdfJob {
  onStage?: (stage: ReportStage) => void;
  signal?: AbortSignal;
}

/** Posts the body to a PDF endpoint, downloads the PDF and saves it on the phone. */
async function requestPdf(path: string, body: object, fallbackName: string, { onStage, signal }: PdfJob): Promise<SavedReport> {
  if (Platform.OS === 'web') throw new ReportRequestError('Reports are made in the phone app.');
  if (signal?.aborted) throw new ReportCancelledError('Cancelled');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);
  const cancelled = () => signal?.aborted === true;
  let bytes: Uint8Array;
  let fileName: string;
  try {
    onStage?.('building');
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      if (cancelled()) throw new ReportCancelledError('Cancelled');
      throw new ReportRequestError(
        controller.signal.aborted
          ? 'The server took too long to make the report. Try again.'
          : "Couldn't reach the server. Check your internet connection and try again.",
      );
    }
    if (!res.ok || !res.headers.get('content-type')?.includes('application/pdf')) {
      throw new ReportRequestError((await serverError(res)) ?? "The server couldn't make the report. Try again.");
    }
    onStage?.('downloading');
    try {
      bytes = new Uint8Array(await res.arrayBuffer());
    } catch {
      if (cancelled()) throw new ReportCancelledError('Cancelled');
      throw new ReportRequestError('The download was cut off. Check your internet connection and try again.');
    }
    fileName = withTimeStamp(decodeURIComponent(res.headers.get('x-file-name') || '') || fallbackName);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
  if (cancelled()) throw new ReportCancelledError('Cancelled');

  onStage?.('saving');
  try {
    const dir = reportsDir();
    if (!dir.exists) dir.create({ intermediates: true });
    // Earlier copies of this same report go; only the newest is kept.
    const base = fileName.replace(/_\d{2}-\d{2}-\d{2}\.pdf$/, '');
    for (const item of dir.list()) {
      if (item instanceof File && item.name.startsWith(base) && item.name !== fileName) {
        try { item.delete(); } catch { /* still open elsewhere; leave it */ }
      }
    }
    const file = new File(dir, fileName);
    if (file.exists) file.delete();
    file.create();
    // writeSync, so the file is complete before anyone opens it.
    file.writeSync(bytes);
    return { uri: file.uri, fileName, sizeBytes: bytes.length };
  } catch {
    throw new ReportRequestError("The report was made but couldn't be saved on this phone. Check its free space and try again.");
  }
}

/** Has the server make a Cost Summary report, saves it on the phone and returns it. */
export async function createCostReport(request: CostReportRequest): Promise<SavedReport> {
  if (request.rows.length === 0) throw new ReportRequestError("There's nothing to put in this report yet.");
  return requestPdf(
    'api/cost-report-pdf',
    {
      type: request.type,
      projectName: request.projectName,
      generatedBy: request.generatedBy,
      clientId: request.clientId || undefined,
      rows: request.rows.map(slimRow[request.type]),
    },
    `${request.type}_report.pdf`,
    request,
  );
}

/**
 * Has the server print a report the app laid out itself (the Profile page's
 * Complete Report), saves it on the phone and returns it.
 */
export async function createHtmlReport(
  request: { html: string; fileName: string } & PdfJob,
): Promise<SavedReport> {
  return requestPdf('api/report-pdf', { html: request.html, fileName: request.fileName }, request.fileName, request);
}

function existingFile(report: SavedReport) {
  const file = new File(report.uri);
  if (!file.exists) throw new Error('This report is no longer on the phone. Generate it again.');
  return file;
}

export async function shareReport(report: SavedReport) {
  const file = existingFile(report);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: report.fileName,
  });
}

// Lets the viewer app read the file it's handed.
const FLAG_GRANT_READ_URI_PERMISSION = 1;

/**
 * Opens the report for reading: Quick Look on iPhone, the phone's PDF app
 * (Drive, Files, Adobe…) on Android. Falls back to the Android view intent,
 * then the share sheet, when the preview isn't available.
 */
export async function openReport(report: SavedReport) {
  const file = existingFile(report);
  try {
    // File.preview arrived in SDK 58; older native builds don't have it.
    if (typeof file.preview === 'function' && (await file.canPreview({ mimeType: 'application/pdf' }))) {
      await file.preview({ title: report.fileName, mimeType: 'application/pdf' });
      return;
    }
  } catch {
    // Fall through to the older ways of opening it.
  }
  if (Platform.OS === 'android') {
    // Not awaited: it resolves only when the viewer is closed.
    IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: file.contentUri,
      type: 'application/pdf',
      flags: FLAG_GRANT_READ_URI_PERMISSION,
    }).catch(() => shareReport(report).catch(() => {}));
    return;
  }
  await shareReport(report);
}
