import React from "react";
import { Button } from "@/components/ui/button.jsx";

export default function DeleteConfirmationDialog({
  show,
  title = "Delete Profile",
  message = "Are you sure you want to delete this profile? This action cannot be undone.",
  onConfirm,
  onCancel,
  isDeleting = false,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-8 space-y-5">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{message}</p>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            variant="outline"
            size="default"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            variant="default"
            size="default"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
