import type { ImportContext, ImportEntityConfig, ImportValidationIssue } from '../types';
import { applyReceipt } from '../../fees/service';

export interface FeesNormalizedRow {
  studentKey?: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  transactionRef?: string;
  feeCategory?: string;
  remarks?: string;
  planCode?: string;
  itemCode?: string;
}

function normalizeLegacy(raw: Record<string, unknown>): FeesNormalizedRow {
  return {
    studentKey: String(raw['AdmissionNo'] ?? raw['StudentName'] ?? '').trim() || undefined,
    amount: Number(raw['Amount'] ?? raw['amount'] ?? raw['FeeAmount'] ?? 0),
    paymentDate: String(raw['Date'] ?? raw['PaymentDate'] ?? raw['date'] ?? '').trim(),
    paymentMethod: String(raw['Method'] ?? raw['PaymentMethod'] ?? raw['payment_method'] ?? '').trim() || undefined,
    transactionRef: String(raw['RefNo'] ?? raw['TransactionRef'] ?? raw['reference'] ?? '').trim() || undefined,
    feeCategory: String(raw['Category'] ?? raw['FeeCategory'] ?? raw['fee_category'] ?? '').trim() || undefined,
    remarks: String(raw['Remarks'] ?? raw['remarks'] ?? raw['Notes'] ?? '').trim() || undefined,
    planCode: String(raw['PlanCode'] ?? raw['plan_code'] ?? '').trim() || undefined,
    itemCode: String(raw['FeeItemCode'] ?? raw['fee_item_code'] ?? '').trim() || undefined,
  };
}

function normalizeLatest(raw: Record<string, unknown>): FeesNormalizedRow {
  return {
    studentKey: String(raw['AdmissionNo'] ?? raw['admission_no'] ?? '').trim() || undefined,
    amount: Number(raw['Amount'] ?? raw['amount_paid'] ?? raw['paid'] ?? 0),
    paymentDate: String(raw['PaymentDate'] ?? raw['payment_date'] ?? raw['date'] ?? '').trim(),
    paymentMethod: String(raw['PaymentMethod'] ?? raw['payment_method'] ?? '').trim() || undefined,
    transactionRef: String(raw['TransactionRef'] ?? raw['transaction_reference'] ?? '').trim() || undefined,
    feeCategory: String(raw['FeeCategory'] ?? raw['fee_category'] ?? '').trim() || undefined,
    remarks: String(raw['Remarks'] ?? raw['remarks'] ?? '').trim() || undefined,
    planCode: String(raw['PlanCode'] ?? raw['plan_code'] ?? '').trim() || undefined,
    itemCode: String(raw['ItemCode'] ?? raw['item_code'] ?? '').trim() || undefined,
  };
}

export const feesImportConfig: ImportEntityConfig<FeesNormalizedRow> = {
  entityType: 'fees',

  normalizeRow(raw, ctx) {
    if (ctx.templateVersion === 'umis-legacy-v1') {
      return normalizeLegacy(raw);
    }
    return normalizeLatest(raw);
  },

  validateRow(normalized) {
    const issues: ImportValidationIssue[] = [];
    if (!normalized.studentKey) {
      issues.push({ rowIndex: -1, fieldName: 'AdmissionNo', errorCode: 'REQUIRED', message: 'Student identifier is required.' });
    }
    if (!normalized.amount || normalized.amount <= 0) {
      issues.push({ rowIndex: -1, fieldName: 'Amount', errorCode: 'INVALID_AMOUNT', message: 'A valid positive amount is required.' });
    }
    if (!normalized.paymentDate) {
      issues.push({ rowIndex: -1, fieldName: 'PaymentDate', errorCode: 'REQUIRED', message: 'Payment date is required.' });
    }
    return issues;
  },

  async matchExisting() {
    return 'none';
  },

  async applyRow(normalized, ctx) {
    const { supabase } = await import('../../../integrations/supabase/client');

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('admission_no', normalized.studentKey)
      .maybeSingle();
    if (!student) throw new Error(`Student not found: ${normalized.studentKey}`);

    let planId: string | undefined;
    let itemId: string | undefined;
    let existingLedgerId: string | undefined;

    if (normalized.planCode) {
      const { data: plan } = await (supabase as any)
        .from('fee_plans')
        .select('id')
        .eq('institution_id', ctx.tenantId)
        .eq('code', normalized.planCode)
        .maybeSingle();
      if (plan) planId = plan.id;

      if (planId && normalized.itemCode) {
        const { data: item } = await (supabase as any)
          .from('fee_items')
          .select('id')
          .eq('institution_id', ctx.tenantId)
          .eq('plan_id', planId)
          .eq('code', normalized.itemCode)
          .maybeSingle();
        if (item) itemId = item.id;
      }
    }

    if (planId && itemId) {
      const { data: existingLedger } = await (supabase as any)
        .from('fee_ledgers')
        .select('id')
        .eq('institution_id', ctx.tenantId)
        .eq('student_id', student.id)
        .eq('plan_id', planId)
        .eq('item_id', itemId)
        .maybeSingle();

      if (existingLedger) {
        existingLedgerId = existingLedger.id;
        await (supabase as any)
          .from('fee_ledgers')
          .update({
            paid_amount: normalized.amount,
            last_payment_date: normalized.paymentDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingLedger.id);
      }
    }

    const receiptNo = `IMP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    await applyReceipt({
      tenantId: ctx.tenantId,
      studentId: student.id,
      receiptNo,
      receiptDate: normalized.paymentDate,
      amount: normalized.amount,
      paymentMode: normalized.paymentMethod,
      referenceNo: normalized.transactionRef,
      actorId: ctx.batchId,
      allocations: existingLedgerId ? [{ ledgerId: existingLedgerId, amount: normalized.amount }] : [],
    });
  },
};
