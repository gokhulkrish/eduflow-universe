/**
 * Homework State Contracts & Persistence
 * 
 * This module defines the contracts and state management for Homework module.
 * Used to defer rollout until workflow, persistence, and state contracts are confirmed safe.
 */

export interface HomeworkAssignmentContract {
  id: string;
  title: string;
  description: string;
  subject: string;
  classId: string;
  staffId?: string;
  dueDate: string;
  dueTime?: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "published" | "closed";
  totalMarks?: number;
  attachments?: string[];
}

export interface HomeworkSubmissionContract {
  id: string;
  homeworkId: string;
  studentId: string;
  submittedAt?: string;
  marks?: number;
  feedback?: string;
  status: "pending" | "submitted" | "graded" | "overdue";
  attachments?: string[];
}

export interface HomeworkApprovalContract {
  id: string;
  homeworkId: string;
  approverStaffId: string;
  approvedAt?: string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
}

export interface HomeworkPersistenceContract {
  assignments: HomeworkAssignmentContract[];
  submissions: HomeworkSubmissionContract[];
  approvals: HomeworkApprovalContract[];
  lastSyncAt: string;
}

const HOMEWORK_ASSIGNMENTS_KEY = "eduflow.homework.assignments.v1";
const HOMEWORK_SUBMISSIONS_KEY = "eduflow.homework.submissions.v1";
const HOMEWORK_APPROVALS_KEY = "eduflow.homework.approvals.v1";

export function loadHomeworkState(): HomeworkPersistenceContract {
  try {
    return {
      assignments: JSON.parse(localStorage.getItem(HOMEWORK_ASSIGNMENTS_KEY) || "[]"),
      submissions: JSON.parse(localStorage.getItem(HOMEWORK_SUBMISSIONS_KEY) || "[]"),
      approvals: JSON.parse(localStorage.getItem(HOMEWORK_APPROVALS_KEY) || "[]"),
      lastSyncAt: new Date().toISOString(),
    };
  } catch {
    return {
      assignments: [],
      submissions: [],
      approvals: [],
      lastSyncAt: new Date().toISOString(),
    };
  }
}

export function saveHomeworkState(state: HomeworkPersistenceContract): {
  success: boolean;
  error?: string;
} {
  try {
    localStorage.setItem(HOMEWORK_ASSIGNMENTS_KEY, JSON.stringify(state.assignments));
    localStorage.setItem(HOMEWORK_SUBMISSIONS_KEY, JSON.stringify(state.submissions));
    localStorage.setItem(HOMEWORK_APPROVALS_KEY, JSON.stringify(state.approvals));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function getHomeworkStats(state: HomeworkPersistenceContract): {
  totalAssignments: number;
  activeAssignments: number;
  totalSubmissions: number;
  submittedCount: number;
  overdueCount: number;
  gradedCount: number;
  pendingApprovals: number;
} {
  const now = new Date();
  const activeAssignments = state.assignments.filter(a => a.status === "published" && new Date(a.dueDate) > now);
  const submitted = state.submissions.filter(s => s.status === "submitted");
  const overdue = state.submissions.filter(s => {
    const hw = state.assignments.find(a => a.id === s.homeworkId);
    return s.status === "pending" && hw && new Date(hw.dueDate) < now;
  });
  const graded = state.submissions.filter(s => s.status === "graded");
  const pendingApprovals = state.approvals.filter(a => a.status === "pending");

  return {
    totalAssignments: state.assignments.length,
    activeAssignments: activeAssignments.length,
    totalSubmissions: state.submissions.length,
    submittedCount: submitted.length,
    overdueCount: overdue.length,
    gradedCount: graded.length,
    pendingApprovals: pendingApprovals.length,
  };
}

export function validateHomeworkAssignment(assignment: Partial<HomeworkAssignmentContract>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!assignment.title?.trim()) errors.push("Assignment title is required");
  if (!assignment.subject?.trim()) errors.push("Subject is required");
  if (!assignment.classId?.trim()) errors.push("Class is required");
  if (!assignment.dueDate?.trim()) errors.push("Due date is required");

  // Validate due date is in future
  if (assignment.dueDate) {
    const due = new Date(assignment.dueDate);
    if (due < new Date()) {
      errors.push("Due date must be in the future");
    }
  }

  if (assignment.totalMarks && assignment.totalMarks <= 0) {
    errors.push("Total marks must be greater than 0");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateHomeworkSubmission(submission: Partial<HomeworkSubmissionContract>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!submission.homeworkId?.trim()) errors.push("Homework ID is required");
  if (!submission.studentId?.trim()) errors.push("Student ID is required");

  if (submission.marks !== undefined) {
    if (submission.marks < 0) errors.push("Marks cannot be negative");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateHomeworkState(state: HomeworkPersistenceContract): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate assignments
  for (const assignment of state.assignments) {
    const validation = validateHomeworkAssignment(assignment);
    if (!validation.valid) errors.push(...validation.errors);
  }

  // Validate submissions
  for (const submission of state.submissions) {
    const validation = validateHomeworkSubmission(submission);
    if (!validation.valid) errors.push(...validation.errors);

    // Check submission references valid homework
    if (!state.assignments.find(a => a.id === submission.homeworkId)) {
      errors.push(`Submission references non-existent homework ${submission.homeworkId}`);
    }
  }

  // Validate approvals
  for (const approval of state.approvals) {
    if (!approval.homeworkId?.trim()) errors.push("Approval homework ID is required");
    if (!approval.approverStaffId?.trim()) errors.push("Approver staff ID is required");

    if (!state.assignments.find(a => a.id === approval.homeworkId)) {
      errors.push(`Approval references non-existent homework ${approval.homeworkId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
