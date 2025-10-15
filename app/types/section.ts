export interface Section {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  materials?: string[]; // Array of material IDs
}

export interface SectionState {
  sections: Section[];
  currentSectionId: string | null;
  isLoading: boolean;
  error: string | null;
}
