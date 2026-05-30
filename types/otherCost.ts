export interface OtherCost {
  id?: number;
  _id?: string;
  // Backend fields (name/unitCost/totalCost) — also keep title/amount as aliases for the UI
  name?: string;
  title?: string;
  amount?: number;
  unitCost?: number;
  totalCost?: number;
  category?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  status?: string;
  date: string;
  sectionId?: string;
  addedBy?: string;
  addedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OtherCostEntry {
  title: string;
  amount: number;
  category?: string;
  description?: string;
}
