# Patch 3 – Student Master Data Read-Only Mirror

## Read APIs

| Endpoint | Implementation | Status |
|---|---|---|
| `GET /api/students` | `src/lib/student-records.ts` – `fetchStudentRegister()` | ✅ Live |
| `GET /api/students/:id` | `src/lib/student-records.ts` – single student lookup | ✅ Live |

## Query Shapes

The read adapter in `legacy/compat/studentReadAdapter.ts` supports the same filter shapes the legacy system used:

| Legacy Filter | Adapter Translation |
|---|---|
| `class=X` | `.eq('grade', X)` |
| `section=Y` | `.eq('section_label', Y)` |
| `batch=Z` | `.eq('academic_year', Z)` |
| `status=active` | `.eq('status', 'active')` |
| `search=text` | `.ilike('display_name', '%text%')` |

## Ordering

Legacy ordering (by roll number, name) is preserved exactly:
- Default sort: `roll_number ASC, first_name ASC`
- Secondary: `admission_no ASC`

## Key Files

- `src/lib/student-records.ts` – primary read functions (641 lines)
- `legacy/compat/studentReadAdapter.ts` – legacy-query-shape adapter
- `src/lib/legacy-adapter.ts` – general-purpose route alias / storage key bridge
