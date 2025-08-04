import React from "react";
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

const EndorsementDialog = ({ open, setOpen, onSend }) => {
  const [message, setMessage] = React.useState("");

  const handleSubmit = () => {
    onSend(message); // pass the message to parent
    setMessage("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="rounded-full cursor-pointer"
          variant="outline"
          size="lg"
        >
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className={""}>
        <DialogHeader className={""}>
          <DialogTitle className={""}>Add an endorsement</DialogTitle>
        </DialogHeader>

        <Textarea
          placeholder="Add a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-4 resize-y"
        />

        <DialogFooter className="mt-4">
          <Button
            variant="default"
            size="default"
            onClick={handleSubmit}
            className="bg-cpg-teal hover:bg-cpg-teal/90 cursor-pointer"
            data-umami-event="Adding Endorsement"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndorsementDialog;
