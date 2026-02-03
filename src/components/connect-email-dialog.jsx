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
import { Mail } from "lucide-react";

const ConnectEmailDialog = ({
  open,
  setOpen,
  targetUser,
  senderUser,
  onSend,
  triggerClassName,
  triggerLabel = "Connect",
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
          className={triggerClassName || "border-2 border-cpg-teal text-cpg-teal hover:bg-cpg-teal/5 rounded-xl"}
          variant={triggerClassName ? "default" : "outline"}
        >
          <Mail className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Send a Message to {targetUser?.full_name || "this person"}
          </DialogTitle>
        </DialogHeader>
        <Textarea
          rows={5}
          placeholder={`Hi ${targetUser?.full_name || "there"}, I'd love to connect!`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-4"
        />
        <DialogFooter className="mt-4">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            className="bg-cpg-teal hover:bg-cpg-teal/90"
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
