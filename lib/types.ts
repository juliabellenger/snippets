export interface Snippet {
  id: string;
  cleanText: string;
  inputType: "typed" | "spoken";
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  name: string;
  count: number;
  lastUsed: string; // ISO timestamp of most recent snippet in this category
}
