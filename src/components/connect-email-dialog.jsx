import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";

const defaultClass = "";

const ConnectEmailDialog = ({
  open,
  setOpen,
  targetUser,
  senderUser,
  onSend,
}) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await onSend(message);
    setSending(false);
    setOpen(false);
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={"bg-cpg-brown hover:bg-cpg-brown/90"}
          variant="default"
          size="lg"
        >
          Connect
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={defaultClass}>
          <DialogTitle className={defaultClass}>
            Send a Message to {targetUser?.email}
          </DialogTitle>
        </DialogHeader>
        <Textarea
          rows={5}
          placeholder={`Hi ${targetUser?.email}, I'd love to connect!`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-4"
        />
        <DialogFooter className="mt-4">
          <Button
            className={defaultClass}
            variant="ghost"
            size="default"
            onClick={() => setOpen(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            className={defaultClass}
            variant="default"
            size="default"
            onClick={handleSend}
            disabled={sending || !message.trim()}
          >
            {sending ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectEmailDialog;
