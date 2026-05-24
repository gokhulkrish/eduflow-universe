import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "./alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./sheet";

describe("DialogContent", () => {
  it("injects an accessible hidden title when callers omit one", () => {
    render(
      <Dialog open>
        <DialogContent>
          <p>Dialog body</p>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("dialog", { name: "Dialog" })).toBeInTheDocument();
    expect(screen.getByText("Dialog body")).toBeInTheDocument();
  });

  it("preserves an explicit title when provided", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admissions Review</DialogTitle>
            <DialogDescription>Review the submitted details before saving.</DialogDescription>
          </DialogHeader>
          <p>Dialog body</p>
        </DialogContent>
      </Dialog>,
    );

    expect(
      screen.getByRole("dialog", {
        name: "Admissions Review",
        description: "Review the submitted details before saving.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Dialog body")).toBeInTheDocument();
  });

  it("injects an accessible title for alert dialogs too", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <p>Danger zone</p>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(screen.getByRole("alertdialog", { name: "Alert dialog" })).toBeInTheDocument();
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
  });

  it("preserves an alert dialog title when provided", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <p>Danger zone</p>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(
      screen.getByRole("alertdialog", {
        name: "Delete record?",
        description: "This action cannot be undone.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
  });

  it("injects an accessible title for sheets too", () => {
    render(
      <Sheet open>
        <SheetContent>
          <p>Sheet body</p>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.getByRole("dialog", { name: "Sheet" })).toBeInTheDocument();
    expect(screen.getByText("Sheet body")).toBeInTheDocument();
  });

  it("preserves a sheet title when provided", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Activity Trace</SheetTitle>
            <SheetDescription>Review the latest actions in this panel.</SheetDescription>
          </SheetHeader>
          <p>Sheet body</p>
        </SheetContent>
      </Sheet>,
    );

    expect(
      screen.getByRole("dialog", {
        name: "Activity Trace",
        description: "Review the latest actions in this panel.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sheet body")).toBeInTheDocument();
  });
});
