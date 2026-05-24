import type { SearchItem } from './types';

const defaultIndex: SearchItem[] = [
  { title: 'Home', section: 'Home', query: 'home dashboard command center overview', type: 'section', url: '/' },
  { title: 'Dashboard', section: 'Home', query: 'dashboard kpi metrics analytics reports', type: 'section', url: '/' },
  { title: 'Students', section: 'Students', query: 'students admission enrollment records', type: 'section', url: '/students' },
  { title: 'Import Wizard', section: 'Import', query: 'import batch wizard upload excel data transfer', type: 'import-step', url: '/import' },
  { title: 'Create Import Batch', section: 'Import', query: 'create batch name type file upload source', type: 'import-step', url: '/import' },
  { title: 'Map Fields', section: 'Import', query: 'mapping field map source target column association', type: 'import-step', url: '/import' },
  { title: 'Keying Setup', section: 'Import', query: 'keying matching primary key match student', type: 'import-step', url: '/import' },
  { title: 'Detect Duplicates', section: 'Import', query: 'duplicates conflict resolution merge consolidate', type: 'import-step', url: '/import' },
  { title: 'Validate', section: 'Import', query: 'validate check readiness quality preview error', type: 'import-step', url: '/import' },
  { title: 'Preview Changes', section: 'Import', query: 'preview changes review before transfer final', type: 'import-step', url: '/import' },
  { title: 'Transfer Batch', section: 'Import', query: 'transfer batch execute finalize commit', type: 'import-step', url: '/import' },
  { title: 'Attendance', section: 'Attendance', query: 'attendance daily marking present absent late', type: 'section', url: '/attendance' },
  { title: 'Assessment', section: 'Assessment', query: 'assessment exam marks scoring grades', type: 'section', url: '/assessment' },
  { title: 'Fees', section: 'Fees', query: 'fees finance payments receipts ledger', type: 'section', url: '/fees' },
  { title: 'Communications', section: 'Communications', query: 'communications sms email campaigns messages', type: 'section', url: '/communications' },
  { title: 'Activity Log', section: 'Tools', query: 'activity log audit trail events monitoring', type: 'function', url: '/activity-log' },
  { title: 'Automation', section: 'Tools', query: 'automation rules workflows business processes', type: 'function', url: '/automation' },
  { title: 'Migration Center', section: 'Tools', query: 'migration patches registry gap analysis', type: 'function', url: '/migration' },
  { title: 'Reports', section: 'Reports', query: 'reports analytics charts export pdf excel', type: 'section', url: '/reports' },
  { title: 'Settings', section: 'Settings', query: 'settings preferences configuration profile', type: 'section', url: '/settings' },
  { title: 'Help', section: 'Help', query: 'help support documentation guide faq', type: 'help', url: '/help' },
];

let searchIndex: SearchItem[] = [...defaultIndex];

export function buildLocalSearchIndex(extra?: SearchItem[]): SearchItem[] {
  if (extra) {
    searchIndex = [...defaultIndex, ...extra];
  }
  return searchIndex;
}

export function searchLocalWorkspace(query: string, items?: SearchItem[]): SearchItem[] {
  const target = items ?? searchIndex;
  const q = query.trim().toLowerCase();
  if (!q) return target;
  return target.filter(item =>
    [item.title, item.section, item.query].some(v => String(v).toLowerCase().includes(q)),
  );
}
