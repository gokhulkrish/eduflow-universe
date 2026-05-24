# Patch 08 – Fees & Finance Migration (Corrected, Strict Upgrade-Only)

## Data Model

| Table | Purpose | Status |
|---|---|---|
| `fee_plans` | Fee plan definitions with status, code, academic year | ✅ Added |
| `fee_items` | Individual fee items per plan with sort order | ✅ Added |
| `fee_ledgers` | Per-student ledger (due, paid, concession, adjustment, risk) | ✅ Added |
| `fee_receipts` | Payment receipts (idempotent, source-tracked) | ✅ Added |
| `fee_receipt_lines` | Receipt-to-ledger allocations | ✅ Added |
| `legacy_fee_entity_map` | Legacy PK → new UUID mapping for rollback | ✅ Added |
| `app_settings` | Tenant settings (e.g. `feeRiskThresholdDays`) | ✅ Added |

### Status & Risk Computation

```
net_due = due_amount + adjustment_amount - concession_amount
outstanding = max(0, net_due - paid_amount)
```

| Status | Condition |
|---|---|
| `paid` | `outstanding = 0` and `net_due > 0` |
| `waived` | `net_due = 0` |
| `partial` | `paid_amount > 0` and `outstanding > 0` |
| `due` | `paid_amount = 0` and `outstanding > 0` |
| `cancelled` | Explicit admin action only |

Risk computed with severity rank (`normal=1, warning=2, critical=3`), not text sorting. Threshold from `app_settings.feeRiskThresholdDays` (default 15).

## Service Layer

| Function | Location | Description |
|---|---|---|
| `applyReceipt` | `src/core/fees/service.ts` | Validates totals, checks idempotency, inserts receipt + lines, updates ledgers, recomputes risk |
| `getFeeSummary` | `src/core/fees/service.ts` | Aggregates by student using corrected `net_due` formula; risk via severity rank |
| `recomputeLedgerStatusAndRisk` | `src/core/fees/service.ts` | Re-evaluates all student ledgers with threshold from `app_settings` |

### Key Business Rules
- Receipt amount **must** equal sum of allocations (within 0.01)
- Idempotency key prevents duplicate receipt submission
- Over-allocating a ledger is prevented (allocation ≤ outstanding)
- Cancelled ledgers reject further payments

## Feature Toggles

| Key | Runtime Key | Default | Phase A | Phase B | Phase C | Phase D |
|---|---|---|---|---|---|---|
| `useNewFeesEngine` | `useNewFees` | `false` | ✗ | ✓ | ✓ | ✓ |
| `useNewFeeReceipts` | `useNewFeeReceipts` | `false` | ✗ | ✗ | ✓ | ✓ |
| `useLegacyFeeReads` | `useLegacyFeeReads` | `true` | ✓ | ✓ | ✓ | ✗ |

## SQL Migrations

1. `20260524190006_fees_and_finance_shell.sql` — Core tables (plans, items, ledgers, receipts, lines)
2. `20260524190007_fees_corrections_and_extensions.sql` — Corrections: `adjustment_amount`, `status`, `sort_order`, `source`, `idempotency_key`, constraints, `legacy_fee_entity_map`, `app_settings`

## Key Files

- `src/core/fees/service.ts` — Corrected fee engine
- `src/legacy/compat/feesAdapter.ts` — Legacy adapter (source-tagged, idempotent)
- `app/api/fees/summary/route.ts` — Summary API (severity rank)
- `docs/migration/patch-08-fee-table-map.md` — Legacy → new field mapping
