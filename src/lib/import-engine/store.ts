import { create } from "zustand";
import type { ImportBatch, ImportPreviewState, ImportCommitResult, ParsedImportFile } from "./types";

export interface ImportEngineState {
  dbReady: boolean;
  dbError: string | null;

  currentBatch: ImportBatch | null;
  batches: ImportBatch[];

  parsedFile: ParsedImportFile | null;
  preview: ImportPreviewState | null;

  commitResult: ImportCommitResult | null;
  committing: boolean;

  currentStep: number;

  setDbReady: (ready: boolean) => void;
  setDbError: (error: string | null) => void;

  setCurrentBatch: (batch: ImportBatch | null) => void;
  setBatches: (batches: ImportBatch[]) => void;
  addBatch: (batch: ImportBatch) => void;
  updateBatch: (batchId: string, updates: Partial<ImportBatch>) => void;
  removeBatch: (batchId: string) => void;

  setParsedFile: (file: ParsedImportFile | null) => void;
  setPreview: (preview: ImportPreviewState | null) => void;

  setCommitResult: (result: ImportCommitResult | null) => void;
  setCommitting: (committing: boolean) => void;

  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  reset: () => void;
}

const initialState = {
  dbReady: false,
  dbError: null,
  currentBatch: null,
  batches: [],
  parsedFile: null,
  preview: null,
  commitResult: null,
  committing: false,
  currentStep: 0,
};

export const useImportEngine = create<ImportEngineState>((set, get) => ({
  ...initialState,

  setDbReady: (dbReady) => set({ dbReady }),
  setDbError: (dbError) => set({ dbError }),

  setCurrentBatch: (currentBatch) => set({ currentBatch }),
  setBatches: (batches) => set({ batches }),

  addBatch: (batch) =>
    set((state) => ({ batches: [...state.batches, batch] })),

  updateBatch: (batchId, updates) =>
    set((state) => ({
      batches: state.batches.map((b) =>
        b.batchId === batchId ? { ...b, ...updates } : b,
      ),
      currentBatch:
        state.currentBatch?.batchId === batchId
          ? { ...state.currentBatch, ...updates }
          : state.currentBatch,
    })),

  removeBatch: (batchId) =>
    set((state) => ({
      batches: state.batches.filter((b) => b.batchId !== batchId),
      currentBatch:
        state.currentBatch?.batchId === batchId
          ? null
          : state.currentBatch,
    })),

  setParsedFile: (parsedFile) => set({ parsedFile }),
  setPreview: (preview) => set({ preview }),

  setCommitResult: (commitResult) => set({ commitResult }),
  setCommitting: (committing) => set({ committing }),

  setCurrentStep: (currentStep) => set({ currentStep }),
  nextStep: () => set((state) => ({ currentStep: Math.min(6, state.currentStep + 1) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

  reset: () => set(initialState),
}));
