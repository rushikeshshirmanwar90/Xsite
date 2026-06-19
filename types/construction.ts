export type PhaseStatus = "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";

export type ImageCategory = "before" | "progress" | "completion";

export type DocumentType =
  | "drawings"
  | "BOQ"
  | "site_instructions"
  | "inspection_reports"
  | "bills"
  | "work_orders";

export interface SubPhase {
  _id: string;
  name: string;
  progress: number;
  status: PhaseStatus;
}

export interface DailyUpdate {
  _id: string;
  date: string;
  status: PhaseStatus;
  progress: number;
  remarks: string;
  contractorRemarks: string;
  delayReason: string;
  siteIssues: string;
  nextAction: string;
  addedBy: string;
  createdAt: string;
}

export interface PhaseImage {
  _id: string;
  category: ImageCategory;
  imageUrl: string;
  caption: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface PhaseDocument {
  _id: string;
  type: DocumentType;
  url: string;
  name: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Phase {
  _id: string;
  name: string;
  order: number;
  status: PhaseStatus;
  progress: number;
  subPhases: SubPhase[];
  dailyUpdates: DailyUpdate[];
  images: PhaseImage[];
  documents: PhaseDocument[];
}

// One tracker per mini-section — each mini-section owns its own independent phase
// list (same template as siblings under the same main section, but never shared).
export interface ConstructionTracker {
  _id: string;
  miniSectionId: string;
  projectId: string;
  projectName: string;
  sectionName: string;
  overallProgress: number;
  phases: Phase[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePhasePayload {
  miniSectionId: string;
  phaseId: string;
  status?: PhaseStatus;
  progress?: number;
  subPhases?: Array<{ id?: string; name?: string; progress?: number; status?: PhaseStatus }>;
}
