import React, { useEffect } from "react";
import { Button } from "@/components/ui/button.jsx";

export default function DiscardChangesGuard({ show, onDiscard, onStay }) {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!show) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-8 space-y-5">
        <h2 className="text-xl font-semibold text-gray-900">
          Discard changes?
        </h2>
        <p className="text-sm text-gray-600">
          You have unsaved changes. Are you sure you want to leave this page?
        </p>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            variant="outline"
            size="default"
            className="w-full sm:w-auto"
            onClick={onStay}
          >
            Stay on Page
          </Button>
          <Button
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            variant="default"
            size="default"
            onClick={onDiscard}
          >
            Discard Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
