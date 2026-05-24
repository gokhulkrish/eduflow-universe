-- Seed data for new migration tables

-- Default fee categories (if not already seeded)
INSERT INTO public.fee_categories (name, description) VALUES
  ('Tuition Fee', 'Regular tuition fee'),
  ('Library Fee', 'Library and resource fee'),
  ('Laboratory Fee', 'Science lab fee'),
  ('Sports Fee', 'Sports and recreation fee'),
  ('Transport Fee', 'Transportation fee'),
  ('Hostel Fee', 'Hostel accommodation fee')
ON CONFLICT (name) DO NOTHING;

-- Default remark templates for academic scoring
INSERT INTO public.remarks_templates (name, category, min_score, max_score, template, variables, is_default) VALUES
  ('Excellent', 'academic', 90, 100, 'Excellent performance with {{score}}%. {{student_name}} shows outstanding understanding of the subject matter.', ARRAY['score', 'student_name'], false),
  ('Good', 'academic', 75, 89, 'Good performance with {{score}}%. {{student_name}} should maintain consistency and focus on weaker areas.', ARRAY['score', 'student_name'], false),
  ('Average', 'academic', 50, 74, 'Average performance with {{score}}%. {{student_name}} needs more practice and revision.', ARRAY['score', 'student_name'], true),
  ('Needs Improvement', 'academic', 35, 49, 'Needs improvement with {{score}}%. {{student_name}} requires additional support and remedial classes.', ARRAY['score', 'student_name'], false),
  ('Concern', 'academic', 0, 34, 'Significant concern with {{score}}%. Immediate remedial intervention is required for {{student_name}}.', ARRAY['score', 'student_name'], false),
  ('Excellent Behavior', 'behavior', 90, 100, '{{student_name}} demonstrates exemplary behavior and is a role model for peers.', ARRAY['student_name'], false),
  ('Satisfactory Behavior', 'behavior', 50, 89, '{{student_name}} behavior is satisfactory. Continues to follow school rules.', ARRAY['student_name'], true),
  ('Needs Behavioral Guidance', 'behavior', 0, 49, '{{student_name}} needs behavioral guidance and counseling.', ARRAY['student_name'], false)
ON CONFLICT DO NOTHING;

-- Default message templates
INSERT INTO public.message_templates (name, type, subject, body, variables) VALUES
  ('Attendance Alert', 'sms', NULL, 'Dear Parent, your ward {{student_name}} was marked {{status}} on {{date}}. Please ensure regular attendance. - School', ARRAY['student_name', 'status', 'date']),
  ('Fee Reminder', 'sms', NULL, 'Dear Parent, fee payment of Rs.{{amount}} is due for {{student_name}} by {{due_date}}. Please pay at earliest. - School', ARRAY['student_name', 'amount', 'due_date']),
  ('Exam Result', 'sms', NULL, '{{student_name}} scored {{percentage}}% in {{exam_name}}. Grade: {{grade}}. - School', ARRAY['student_name', 'percentage', 'exam_name', 'grade']),
  ('General Notice', 'email', 'Notice: {{subject}}', 'Dear Parent,\n\n{{body}}\n\nRegards,\nSchool Administration', ARRAY['subject', 'body']),
  ('Event Invitation', 'sms', NULL, 'You are invited to {{event_name}} on {{date}}. Venue: {{venue}}. - School', ARRAY['event_name', 'date', 'venue'])
ON CONFLICT DO NOTHING;

-- Default promotion rules for common grade levels
INSERT INTO public.promotion_rules (name, from_grade, to_grade, min_attendance, min_gpa, auto_promote, reset_roll, status) VALUES
  ('Primary 1→2', 'Class 1', 'Class 2', 75, 2.0, true, false, 'active'),
  ('Primary 2→3', 'Class 2', 'Class 3', 75, 2.0, true, false, 'active'),
  ('Primary 3→4', 'Class 3', 'Class 4', 75, 2.0, true, false, 'active'),
  ('Primary 4→5', 'Class 4', 'Class 5', 75, 2.0, true, false, 'active'),
  ('Middle 5→6', 'Class 5', 'Class 6', 75, 2.5, true, false, 'active'),
  ('Middle 6→7', 'Class 6', 'Class 7', 75, 2.5, true, false, 'active'),
  ('Middle 7→8', 'Class 7', 'Class 8', 75, 2.5, true, false, 'active'),
  ('Secondary 8→9', 'Class 8', 'Class 9', 80, 3.0, false, false, 'active'),
  ('Secondary 9→10', 'Class 9', 'Class 10', 80, 3.0, false, false, 'active'),
  ('Senior 10→11', 'Class 10', 'Class 11', 85, 3.5, false, true, 'active'),
  ('Senior 11→12', 'Class 11', 'Class 12', 85, 3.5, false, true, 'active')
ON CONFLICT DO NOTHING;
