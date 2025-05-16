// EndorsementEditDialog.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Button } from "@/components/ui/button.jsx";
import { DialogTrigger } from "@radix-ui/react-dialog";

const defaultClass = "";

const EndorsementEditDialog = ({ open, setOpen, initialMessage, onSave }) => {
  const [message, setMessage] = useState(initialMessage || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onSave(message);
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={defaultClass}>
        <DialogHeader className={defaultClass}>
          <DialogTitle className={defaultClass}>
            Edit Your Endorsement
          </DialogTitle>
        </DialogHeader>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-4 resize-y"
        />

        <DialogFooter className="mt-4">
          <Button
            className={defaultClass}
            variant="outline"
            size="default"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="default"
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
            className="bg-cpg-teal hover:bg-cpg-teal/90 cursor-pointer"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndorsementEditDialog;
