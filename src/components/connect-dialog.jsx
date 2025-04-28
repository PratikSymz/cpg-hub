import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Button } from "@/components/ui/button.jsx";

const ConnectDialog = ({ open, setOpen, onSend }) => {
  const [message, setMessage] = React.useState("");

  const handleSubmit = () => {
    onSend(message); // pass the message to parent
    setMessage("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a connection request</DialogTitle>
        </DialogHeader>

        <Textarea
          placeholder="Add a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="resize-none"
        />

        <DialogFooter className="mt-4">
          <Button
            variant="default"
            size="default"
            onClick={handleSubmit}
            className="bg-cpg-teal hover:bg-cpg-teal/90"
          >
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectDialog;
