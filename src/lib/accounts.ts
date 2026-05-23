import { emitAppSync } from "@/lib/app-sync";

export type Transaction = { id: string; date: string; description: string; category: string; type: "income" | "expense"; amount: number; reference: string; };
export type Budget = { id: string; category: string; allocated: number; spent: number; fiscal_year: string; };

export const transactionsKey = "eduflow_transactions";
export const budgetsKey = "eduflow_budgets";

function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export function getTransactions(): Transaction[] { return ls(transactionsKey, []); }
export function createTransaction(t: Omit<Transaction, "id">): Transaction {
  const items = getTransactions(); const n = { ...t, id: crypto.randomUUID() };
  items.unshift(n); ss(transactionsKey, items); return n;
}
export function deleteTransaction(id: string) { ss(transactionsKey, getTransactions().filter((x) => x.id !== id)); }

export function getBudgets(): Budget[] { return ls(budgetsKey, []); }
export function createBudget(b: Omit<Budget, "id">): Budget {
  const items = getBudgets(); const n = { ...b, id: crypto.randomUUID() };
  items.push(n); ss(budgetsKey, items); return n;
}
export function updateBudget(id: string, p: Partial<Budget>) { const items = getBudgets(); const i = items.findIndex((x) => x.id === id); if (i >= 0) { items[i] = { ...items[i], ...p }; ss(budgetsKey, items); } }
export function deleteBudget(id: string) { ss(budgetsKey, getBudgets().filter((x) => x.id !== id)); }

export const CATEGORIES = ["Tuition", "Transport", "Library", "Lab", "Sports", "Events", "Salary", "Utilities", "Maintenance", "Supplies", "Other"];
