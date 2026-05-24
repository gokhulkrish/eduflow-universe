import { pool } from '@/db/pool';

export type FeeRiskState = 'normal' | 'warning' | 'critical';

export interface ApplyReceiptInput {
  tenantId: string;
  studentId: string;
  receiptNo: string;
  receiptDate: string;
  amount: number;
  paymentMode?: string;
  referenceNo?: string;
  actorId?: string;
  idempotencyKey?: string;
  source?: 'system' | 'legacy-adapter' | 'import';
  allocations: { ledgerId: string; amount: number }[];
}

export async function applyReceipt(input: ApplyReceiptInput): Promise<string> {
  const totalAllocated = input.allocations.reduce((s, x) => s + Number(x.amount || 0), 0);
  if (Number(totalAllocated.toFixed(2)) !== Number(input.amount.toFixed(2))) {
    throw new Error('Receipt amount must equal total allocations.');
  }

  const client = await pool.connect();
  try {
    await client.query('begin');

    if (input.idempotencyKey) {
      const existing = await client.query(
        `select id from public.fee_receipts where institution_id = $1 and idempotency_key = $2 limit 1`,
        [input.tenantId, input.idempotencyKey],
      );
      if (existing.rows[0]?.id) {
        await client.query('commit');
        return existing.rows[0].id as string;
      }
    }

    const receiptInsert = await client.query(
      `insert into public.fee_receipts (
        institution_id, student_id, receipt_no, receipt_date, amount, payment_mode, reference_no, source, idempotency_key, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      returning id`,
      [
        input.tenantId,
        input.studentId,
        input.receiptNo,
        input.receiptDate,
        input.amount,
        input.paymentMode ?? null,
        input.referenceNo ?? null,
        input.source ?? 'system',
        input.idempotencyKey ?? null,
        input.actorId ?? null,
      ],
    );

    const receiptId = receiptInsert.rows[0].id as string;

    for (const alloc of input.allocations) {
      const ledgerRes = await client.query(
        `select id, due_amount, paid_amount, concession_amount, adjustment_amount, due_date, status
         from public.fee_ledgers
         where institution_id = $1 and id = $2 and student_id = $3
         for update`,
        [input.tenantId, alloc.ledgerId, input.studentId],
      );
      const ledger = ledgerRes.rows[0];
      if (!ledger) throw new Error(`Ledger not found: ${alloc.ledgerId}`);
      if (ledger.status === 'cancelled') throw new Error(`Cannot apply payment to cancelled ledger: ${alloc.ledgerId}`);

      const netDue = Number(ledger.due_amount) + Number(ledger.adjustment_amount) - Number(ledger.concession_amount);
      const outstanding = Math.max(0, netDue - Number(ledger.paid_amount));
      if (Number(alloc.amount) > outstanding) {
        throw new Error(`Allocation exceeds outstanding for ledger: ${alloc.ledgerId}`);
      }

      await client.query(
        `insert into public.fee_receipt_lines (institution_id, receipt_id, ledger_id, amount)
         values ($1,$2,$3,$4)`,
        [input.tenantId, receiptId, alloc.ledgerId, alloc.amount],
      );

      await client.query(
        `update public.fee_ledgers
         set paid_amount = paid_amount + $3,
             last_payment_date = $4,
             updated_at = now()
         where institution_id = $1 and id = $2`,
        [input.tenantId, alloc.ledgerId, alloc.amount, input.receiptDate],
      );
    }

    await recomputeLedgerStatusAndRisk(client, input.tenantId, input.studentId);

    await client.query('commit');
    return receiptId;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function recomputeLedgerStatusAndRisk(client: any, tenantId: string, studentId: string) {
  const settingsRes = await client.query(
    `select value from public.app_settings where institution_id = $1 and key = 'feeRiskThresholdDays' limit 1`,
    [tenantId],
  );
  const threshold = Number(settingsRes.rows[0]?.value ?? 15);

  const ledgersRes = await client.query(
    `select id, due_amount, paid_amount, concession_amount, adjustment_amount, due_date, status
     from public.fee_ledgers
     where institution_id = $1 and student_id = $2
     for update`,
    [tenantId, studentId],
  );

  const today = new Date();
  for (const row of ledgersRes.rows) {
    if (row.status === 'cancelled') continue;

    const netDue = Number(row.due_amount) + Number(row.adjustment_amount) - Number(row.concession_amount);
    const outstanding = Math.max(0, netDue - Number(row.paid_amount));

    let status: 'due' | 'partial' | 'paid' | 'waived' | 'cancelled' = 'due';
    if (netDue <= 0) status = 'waived';
    else if (outstanding === 0) status = 'paid';
    else if (Number(row.paid_amount) > 0) status = 'partial';

    let risk: FeeRiskState = 'normal';
    if (outstanding > 0 && row.due_date) {
      const dueDate = new Date(row.due_date);
      const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / 86400000);
      if (overdueDays > 0 && overdueDays < threshold) risk = 'warning';
      else if (overdueDays >= threshold) risk = 'critical';
    }

    await client.query(
      `update public.fee_ledgers set status = $3, risk_state = $4, updated_at = now() where institution_id = $1 and id = $2`,
      [tenantId, row.id, status, risk],
    );
  }
}
