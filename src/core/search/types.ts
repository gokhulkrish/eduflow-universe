export type SearchItemType = 'section' | 'import-step' | 'dashboard-metric' | 'function' | 'help' | 'feature';

export interface SearchItem {
  title: string;
  section: string;
  query: string;
  sectionId?: string;
  type: SearchItemType;
  url?: string;
}
