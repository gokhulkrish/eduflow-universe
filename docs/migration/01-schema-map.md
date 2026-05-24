# Patch 01 – Legacy Data Model → Supabase Schema Map

> Schema-first, non-destructive mapping between legacy `SMS-2.html` concepts and new PostgreSQL/Supabase tables. This document is the **source of truth** for all field-level mappings.

---

## 1. Design Principles

- **No destructive changes** to any existing tables.
- Every table has `id` (uuid PK), `created_at`, `updated_at` (timestamptz).
- Multi-tenant via `institution_id` (equivalent to `tenant_id` in the idealized spec).
- Legacy identifiers stored as **non-PK columns** (`admission_no`, `umis_id`, `emis_id`).
- Enums for statuses instead of magic strings where possible.

---

## 2. Students & Identities

### Table: `public.students`

| Legacy Concept | Legacy Label / Field | New Column | Type | Constraints | Notes |
|---|---|---|---|---|---|
| Student admission number | "Admission No" | `admission_no` | text | `UNIQUE` | Serves as `legacyId` in compat layer. |
| UMIS internal ID | hidden `umis_id` | `umis_id` | text | `UNIQUE` | For traceability only. |
| EMIS ID | hidden `emis_id` | `emis_id` | text | `UNIQUE` | Government EMIS identifier. |
| First name | "First Name" | `first_name` | text | `NOT NULL` | |
| Last name | "Last Name" | `last_name` | text | | |
| Date of birth | "DOB" | `dob` | date | | |
| Gender | "Gender" | `gender` | text | | Values: `male`, `female`, `other`. |
| Blood group | "Blood Group" | `blood_group` | text | | |
| Nationality | "Nationality" | `nationality` | text | | Default `'Indian'`. |
| Email | "Email" | `email` | text | | |
| Phone | "Phone" | `phone` | text | | |
| Alternate phone | "Alt Phone" | `alternate_phone` | text | | |
| Address | "Address" | `address` | text | | |
| Community | "Community" | `community` | text | | |
| First graduate | "First Graduate" | `first_graduate` | boolean | Default `false` | |
| Income verification | "Income Verified" | `income_verification_status` | enum | `verification_status` | `pending`, `agreed`, `appealed`, `verified`, `rejected` |
| Scholarship notes | "Scholarship" | `scholarship_notes` | text | | |
| Fee status | "Fee Status" | `fee_status` | text | Default `'Pending'` | |
| Attendance % | "Attendance %" | `attendance_percent` | numeric(5,2) | CHECK 0–100 | Computed from `attendance` table. |
| Status | "Status" | `status` | enum | `student_status` | `active`, `inactive`, `graduated`, `transferred`, `withdrawn`, `alumni` |
| Institution | (derived from context) | `institution_id` | uuid | FK → `institutions.id` | Multi-tenant key. |

### Table: `public.enrollments` (student academic placement)

| Legacy Concept | New Column | Type | Constraints | Notes |
|---|---|---|---|---|
| Class/grade | `grade_label` | text | | Denormalized from `class_level_id`. |
| Section | `section_label` | text | | Denormalized from `section_id`. |
| Roll number | `roll_number` | integer | | Unique per class+section when active. |
| Academic year | `academic_year_label` | text | | Denormalized from `academic_year_id`. |
| Stream | `stream` | text | | |
| House | `house` | text | | |
| Status | `status` | enum | `enrollment_status` | `active`, `completed`, `promoted`, `transferred`, `withdrawn` |
| Joined on | `joined_on` | date | | |
| Left on | `left_on` | date | | |

**Open Question:** The spec describes `students.class_id` and `students.section_id` as direct FKs, but the implementation uses a separate `enrollments` table for academic placement. This allows multiple enrollment histories per student. All downstream code reads placement from `student_register` view which joins through enrollments.

---

## 3. Academic Structure

### Table: `public.class_levels` (mapped from `classes` in the spec)

| Legacy Concept | New Column | Type | Constraints | Notes |
|---|---|---|---|---|
| Class name ("Grade 8") | `label` | text | `NOT NULL` | Named `class_levels` not `classes`. |
| Sort order | `sort_order` | integer | `NOT NULL` | For ordering Pre-KG→Grade 12. |
| Institution | `institution_id` | uuid | FK → `institutions.id` | |

### Table: `public.sections`

| Legacy Concept | New Column | Type | Constraints | Notes |
|---|---|---|---|---|
| Section name ("A") | `label` | text | `NOT NULL` | |
| Capacity | `capacity` | integer | | |
| Class level | `class_level_id` | uuid | FK → `class_levels.id` | |
| Institution | `institution_id` | uuid | FK → `institutions.id` | |

### Table: `public.subjects`

| Legacy Concept | New Column | Type | Constraints | Notes |
|---|---|---|---|---|
| Subject name | `name` | text | `NOT NULL` | |
| Subject code | `code` | text | | |
| Institution | `institution_id` | uuid | FK → `institutions.id` | |

**Open Question:** The spec's `classes` table maps to `class_levels` in the implementation. A `classes` alias view can be added if legacy code references the name directly. The spec's `class_level_id` FK pattern is used instead of `class_id` for disambiguation.

---

## 4. Imports & Batches (UMIS Engine)

### Table: `public.import_batches`

| Legacy Concept | New Column | Type | Constraints | Notes |
|---|---|---|---|---|
| Batch name | `batch_name` | text | `NOT NULL` | |
| Description | `batch_description` | text | | |
| Module (entity type) | `module_id` | text | Default `'students'` | `students`, `attendance`, `fees` |
| Mode | `mode` | text | Default `'hybrid'` | |
| Status | `status` | text | CHECK states | `draft`, `validated`, `ready_to_apply`, `applied`, `archived` |
| Match strategy | `match_strategy` | text | | E.g. `admission_no`, `umis_id` |
| Row counts | `row_count`, `valid_count`, `error_count` | integer | | Denormalized counters. |
| Applied counts | `inserted_count`, `updated_count`, `skipped_count` | integer | | |
| Creator | `created_by` | uuid | FK → `auth.users.id` | |
| Metadata | `meta` | jsonb | Default `'{}'` | |
| Applied at | `applied_at` | timestamptz | | |
| Archived at | `archived_at` | timestamptz | | |

### Table: `public.import_files`

| Legacy Concept | New Column | Type | Notes |
|---|---|---|---|
| File name | `file_name` | text | Original filename |
| File type | `file_type` | text | E.g. `csv`, `xlsx` |
| Sheet name | `sheet_name` | text | For multi-sheet workbooks |
| File size | `file_size` | integer | Bytes |
| Storage path | `storage_path` | text | Supabase Storage path |
| Headers | `headers` | jsonb | Parsed column headers |
| Row count | `row_count` | integer | |

### Table: `public.import_rows`

| Legacy Concept | New Column | Type | Notes |
|---|---|---|---|
| Row number | `row_number` | integer | Within source file |
| Source data | `source_data` | jsonb | Raw parsed row |
| Target data | `target_data` | jsonb | Normalized for insert/update |
| Decision | `decision` | text | `insert`, `update`, `skip`, `review` |
| Match status | `match_status` | text | `exact`, `fuzzy`, `none`, `internal-duplicate` |
| Match score | `match_score` | real | Confidence 0–1 |
| Matched student | `matched_student_id` | uuid | FK → `students.id` |

### Table: `public.import_row_errors`

| Legacy Concept | New Column | Type | Notes |
|---|---|---|---|
| Field | `field` | text | Column name |
| Message | `message` | text | Human-readable error |
| Severity | `severity` | text | `error`, `warning`, `blocker` |

---

## 5. Attendance (Shell)

### Table: `public.attendance`

| Legacy Concept | New Column | Type | Constraints | Notes |
|---|---|---|---|---|
| Student | `student_id` | uuid | FK → `students.id` | |
| Date | `date` | date | `NOT NULL` | |
| Period | `period` | text | | Null = full-day; values like `"1"`, `"2"` for period-level |
| Status | `status` | text | Default `'present'` | Values: `present`, `absent`, `late`, `half-day`, `holiday` |
| Remarks | `remarks` | text | | |
| Marked by | `marked_by` | uuid | | User who recorded |

**Design Decision:** The spec's `attendance_days` table is simplified to the existing `attendance` table which support both day-level and period-level records in the same table. The unique constraint `(student_id, date, period)` allows a `period IS NULL` row for full-day attendance plus individual period rows.

---

## 6. Assessment (Shell)

### Table: `public.exam_schedules`

| Legacy Concept | New Column | Type | Notes |
|---|---|---|---|
| Exam title | `title` | text | |
| Exam type | `exam_type` | enum | `quiz`, `unit_test`, `midterm`, `final`, `preboard`, `other` |
| Grade | `grade` | text | Denormalized |
| Section | `section` | text | |
| Subject | `subject` | text | Denormalized |
| Max marks | `max_marks` | int | |
| Pass marks | `pass_marks` | int | |
| Date | `date` | date | |
| Time | `start_time`, `end_time` | time | |

### Table: `public.exam_marks`

| Legacy Concept | New Column | Type | Notes |
|---|---|---|---|
| Exam | `exam_id` | uuid | FK → `exam_schedules.id` |
| Student | `student_id` | uuid | FK → `students.id` |
| Marks obtained | `marks_obtained` | numeric(6,2) | |
| Grade | `grade` | text | Letter grade |
| Status | `status` | enum | `pending`, `approved`, `rejected` |

### NEW TABLE: `public.exam_terms` (added in Patch 01)

Defined in migration `20260524190001_exam_terms_and_components.sql`.

| Legacy Concept | New Column | Type | Notes |
|---|---|---|---|
| Term name | `name` | text | E.g. "Term 1" |
| Term code | `code` | text | E.g. "T1" |
| Start date | `start_date` | date | |
| End date | `end_date` | date | |
| Institution | `institution_id` | uuid | FK → `institutions.id` |

### NEW TABLE: `public.exam_components` (added in Patch 01)

Defined in migration `20260524190001_exam_terms_and_components.sql`.

| Legacy Concept | New Column | Type | Notes |
|---|---|---|---|
| Component name | `name` | text | E.g. "Unit Test 1" |
| Component code | `code` | text | E.g. "UT1" |
| Term | `term_id` | uuid | FK → `exam_terms.id` |
| Subject | `subject_id` | uuid | FK → `subjects.id` |
| Max marks | `max_marks` | numeric(6,2) | |
| Weight | `weight` | numeric(5,2) | Percentage contribution |

---

## 7. Status Enums Reference

| Enum Name | Values | Used By |
|---|---|---|
| `person_status` | `active`, `inactive`, `archived` | `institutions`, `campuses`, `academic_years`, `departments`, etc. |
| `student_status` | `active`, `inactive`, `graduated`, `transferred`, `withdrawn`, `alumni` | `students` |
| `enrollment_status` | `active`, `completed`, `promoted`, `transferred`, `withdrawn` | `enrollments` |
| `guardian_relationship` | `father`, `mother`, `guardian`, `grandparent`, `sibling`, `other` | `guardians`, `student_guardians` |
| `staff_status` | `active`, `on_leave`, `inactive`, `relieved` | `staff`, `faculty` |
| `verification_status` | `pending`, `agreed`, `appealed`, `verified`, `rejected` | `students.income_verification_status` |
| `exam_status` | `draft`, `published`, `completed`, `cancelled` | `exam_schedules` |
| `exam_type` | `quiz`, `unit_test`, `midterm`, `final`, `preboard`, `other` | `exam_schedules` |
| `mark_status` | `pending`, `approved`, `rejected` | `exam_marks` |
| Import batch status | `draft`, `validated`, `ready_to_apply`, `applied`, `archived` | `import_batches.status` (text CHECK) |
| Row decision | `insert`, `update`, `skip`, `review` | `import_rows.decision` (text CHECK) |

---

## 8. Open Questions

1. **`students.class_id` vs `enrollments` indirection** — The spec proposes direct `class_id`/`section_id` on `students`, but the implementation uses `enrollments` for historical tracking. Confirm whether a denormalized `current_class_id` + `current_section_id` on `students` is needed for performance.

2. **`classes` vs `class_levels` naming** — The spec uses `classes` but the DB uses `class_levels`. If legacy SQL or ORM code references `classes`, add a `CREATE VIEW classes AS SELECT * FROM class_levels` alias.

3. **Attendance period granularity** — The `attendance` table supports both full-day (`period IS NULL`) and per-period records. Confirm whether period-level attendance is required for the import engine or if day-level is sufficient for Patch 01.

4. **`exam_terms` and `exam_components` linkage** — The spec links components to `exam_schedules` indirectly. Confirm if `exam_schedules` should reference `exam_components` or vice versa.

5. **`full_name` generated column** — The spec proposes a generated `full_name` on `students`, but the `student_register` view computes `display_name` via `trim(concat_ws(' ', first_name, last_name))`. Revisit if a generated column is needed for indexing.

6. **`tenant_id` vs `institution_id`** — The spec uses `tenant_id` but the implementation uses `institution_id`. These are semantically equivalent. Align to `institution_id` for consistency with existing migrations.
