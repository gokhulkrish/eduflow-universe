# Patch 08 — Fee Table Mapping (Legacy ↔ New System)

## Table Mapping

| Legacy Concept | New System Table | Notes |
|---|---|---|
| Fee structures | `fee_plans` | Mapped by `code` via `legacy_fee_entity_map` |
| Fee items per structure | `fee_items` | Mapped by `(plan_id, code)` |
| Student fee ledger | `fee_ledgers` | One row per student per item; unique on `(institution_id, student_id, item_id)` |
| Receipts | `fee_receipts` | Unique on `(institution_id, receipt_no)`; idempotent via `idempotency_key` |
| Receipt allocations | `fee_receipt_lines` | Links receipt to ledger with allocated amount |
| Legacy entity IDs | `legacy_fee_entity_map` | Tracks old PK → new UUID for rollback |

## Column Mapping (Legacy → New)

| Legacy Field | New Field | Transform |
|---|---|---|
| `fee_structure.id` | → `legacy_fee_entity_map.new_entity_id` | Insert map row on first migration |
| `fee_structure.name` | → `fee_plans.name` | Direct copy |
| `fee_structure.code` | → `fee_plans.code` | Direct copy |
| `fee_structure.grade` | → Store in `fee_plans.description` or linked table | |
| `fee_item.amount` | → `fee_items.amount` | Direct copy |
| `fee_item.due_date` | → `fee_items.due_date` | Parse legacy format |
| `student_fee.due` | → `fee_ledgers.due_amount` | Direct copy |
| `student_fee.paid` | → `fee_ledgers.paid_amount` | Sum of receipt lines |
| `student_fee.concession` | → `fee_ledgers.concession_amount` | Direct copy |
| `receipt.amount` | → `fee_receipts.amount` | Direct copy |
| `receipt.mode` | → `fee_receipts.payment_mode` | Normalize to allowed values |

## Risk Computation

| State | Condition |
|---|---|
| `normal` | Outstanding = 0, or due date not yet crossed |
| `warning` | Overdue days > 0 and < threshold (default 15) |
| `critical` | Overdue days >= threshold |

Threshold read from `app_settings` key `feeRiskThresholdDays`.

## Feature Toggle Phases

| Phase | `useNewFeesEngine` | `useNewFeeReceipts` | `useLegacyFeeReads` |
|---|---|---|---|
| A (Shadow) | false | false | true |
| B (Fees On) | true | false | true |
| C (Receipts On) | true | true | true |
| D (Full) | true | true | false |
