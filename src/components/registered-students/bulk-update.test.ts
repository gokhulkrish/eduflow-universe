import { describe, it, expect } from "vitest";
import {
  REGISTEREDRIBBONACTIONS,
  validateUpdatePayload,
  applyStudentUpdate,
  appendRegisteredHistory,
  pushRegisteredUndoSnapshot,
  getRegisteredActionTargetKeys,
  getRegisteredViewSnapshot,
  getOrderedHeaders,
} from "./BulkUpdateEngine";

describe("REGISTEREDRIBBONACTIONS", () => {
  it("defines action for set-status-active", () => {
    const action = REGISTEREDRIBBONACTIONS["set-status-active"];
    expect(action).toBeDefined();
    expect(action.changes).toEqual({ status: "active" });
    expect(action.label).toBe("Set status to Active");
  });

  it("defines action for scholarship-flag", () => {
    const action = REGISTEREDRIBBONACTIONS["scholarship-flag"];
    expect(action).toBeDefined();
    expect(action.changes).toEqual({ first_graduate: true });
  });

  it("defines all required status actions", () => {
    const expected = [
      "set-status-active",
      "set-status-transfer",
      "set-status-alumni",
      "set-status-dropout",
      "scholarship-flag",
      "verification-pending",
      "approve",
      "reject",
    ];
    for (const key of expected) {
      expect(REGISTEREDRIBBONACTIONS[key]).toBeDefined();
    }
  });
});

describe("validateUpdatePayload", () => {
  it("returns null for valid payload with changes", () => {
    expect(validateUpdatePayload({ changes: { status: "active" } })).toBeNull();
  });

  it("returns null for valid payload with field+value", () => {
    expect(validateUpdatePayload({ field: "status", value: "active" })).toBeNull();
  });

  it("returns error for empty payload", () => {
    expect(validateUpdatePayload({})).toBe(
      "Either changes or (field + value) must be provided",
    );
  });
});

describe("applyStudentUpdate", () => {
  it("applies changes to student record", () => {
    const student = { id: "s1", status: "active" };
    const updated = applyStudentUpdate(student, { changes: { status: "transferred" } });
    expect(updated.status).toBe("transferred");
    expect(updated.id).toBe("s1");
  });

  it("applies field+value update", () => {
    const student = { id: "s1", name: "Test" };
    const updated = applyStudentUpdate(student, { field: "name", value: "Updated" });
    expect(updated.name).toBe("Updated");
  });

  it("applies nested update via nestedPath", () => {
    const student = { id: "s1", meta: { family: {} } };
    const updated = applyStudentUpdate(student, {
      changes: { fatherName: "John" },
      nestedPath: "meta.family.fatherName",
    });
    expect((updated.meta as Record<string, unknown>).family).toEqual({ fatherName: "John" });
  });

  it("sets updatedAt timestamp", () => {
    const student = { id: "s1" };
    const updated = applyStudentUpdate(student, { changes: { status: "active" } });
    expect(typeof updated.updatedAt).toBe("string");
    expect(new Date(updated.updatedAt as string).getTime()).not.toBeNaN();
  });
});

describe("appendRegisteredHistory", () => {
  it("appends history entry to student without existing history", () => {
    const student = { id: "s1" };
    const result = appendRegisteredHistory(student, "status-change", { status: "active" });
    expect(result.history).toHaveLength(1);
    expect(result.history[0].action).toBe("status-change");
    expect(result.history[0].changes).toEqual({ status: "active" });
  });

  it("appends to existing history array", () => {
    const student = { id: "s1", history: [{ action: "create", changes: {}, timestamp: "2024-01-01" }] };
    const result = appendRegisteredHistory(student, "update", { status: "active" });
    expect(result.history).toHaveLength(2);
  });
});

describe("pushRegisteredUndoSnapshot", () => {
  it("captures snapshots of student state", () => {
    const students = [{ id: "s1", status: "active" }];
    const snapshot = pushRegisteredUndoSnapshot(["s1"], students);
    expect(snapshot.keys).toEqual(["s1"]);
    expect(snapshot.before).toHaveLength(1);
    expect(snapshot.before[0].status).toBe("active");
    expect(snapshot.before[0]).not.toBe(students[0]);
  });
});

describe("getRegisteredActionTargetKeys", () => {
  it("returns selected keys when selection exists", () => {
    const selected = new Set(["s1", "s2"]);
    const visible = [{ id: "s1" }, { id: "s2" }, { id: "s3" }];
    expect(getRegisteredActionTargetKeys(selected, visible)).toEqual(["s1", "s2"]);
  });

  it("returns all visible keys when no selection", () => {
    expect(getRegisteredActionTargetKeys(new Set(), [{ id: "a" }, { id: "b" }])).toEqual(["a", "b"]);
  });
});

describe("getRegisteredViewSnapshot", () => {
  it("returns structured snapshot", () => {
    const result = getRegisteredViewSnapshot(
      ["name", "status"],
      [{ name: "Test", status: "active" }],
      [{ id: "1" }],
    );
    expect(result.headers).toEqual(["name", "status"]);
    expect(result.rows).toHaveLength(1);
    expect(result.records).toHaveLength(1);
  });
});

describe("getOrderedHeaders", () => {
  it("returns all headers when no column settings", () => {
    expect(getOrderedHeaders(undefined, ["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("orders headers by column settings order", () => {
    const columns = { order: ["c", "a", "b"] };
    expect(getOrderedHeaders(columns, ["a", "b", "c"])).toEqual(["c", "a", "b"]);
  });

  it("appends remaining headers not in order", () => {
    const columns = { order: ["c"] };
    expect(getOrderedHeaders(columns, ["a", "b", "c"])).toEqual(["c", "a", "b"]);
  });
});
