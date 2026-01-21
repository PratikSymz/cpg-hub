import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useClerk } from "@clerk/clerk-react";

const defaultClass = "cursor-pointer";

const ShowLoginDialog = ({ open, setOpen }) => {
  const { redirectToSignIn } = useClerk();

  const handleSend = async () => {
    setOpen(false);
    redirectToSignIn();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={defaultClass}>
          <DialogTitle className={defaultClass}>Sign in Required</DialogTitle>
        </DialogHeader>
        <p>You need to be signed in to provide feedback.</p>
        <DialogFooter className="mt-4">
          <Button
            className={defaultClass}
            variant="ghost"
            size="default"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className={defaultClass}
            variant="default"
            size="default"
            onClick={handleSend}
          >
            Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShowLoginDialog;
