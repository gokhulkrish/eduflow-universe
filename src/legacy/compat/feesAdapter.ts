import { applyReceipt } from '../../core/fees/service';

export interface LegacyReceiptPayload {
  tenant_id: string;
  student_id: string;
  receipt_no: string;
  receipt_date: string;
  amount: number;
  payment_mode?: string;
  reference_no?: string;
  actor_id?: string;
  idempotency_key?: string;
  allocations: { ledger_id: string; amount: number }[];
}

export async function legacyApplyReceipt(payload: LegacyReceiptPayload) {
  return applyReceipt({
    tenantId: payload.tenant_id,
    studentId: payload.student_id,
    receiptNo: payload.receipt_no,
    receiptDate: payload.receipt_date,
    amount: payload.amount,
    paymentMode: payload.payment_mode,
    referenceNo: payload.reference_no,
    actorId: payload.actor_id,
    idempotencyKey: payload.idempotency_key,
    source: 'legacy-adapter',
    allocations: payload.allocations.map((a) => ({ ledgerId: a.ledger_id, amount: a.amount })),
  });
}
