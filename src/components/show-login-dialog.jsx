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
import { useNavigate } from "react-router-dom";

const defaultClass = "cursor-pointer";

const ShowLoginDialog = ({ open, setOpen }) => {
  const navigate = useNavigate();

  const handleSend = async () => {
    window.location.href = "https://accounts.mycpghub.com/sign-in";
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className={defaultClass}>
          <DialogTitle className={defaultClass}>Sign in Required</DialogTitle>
        </DialogHeader>
        <p>You need to be signed in to connect with talent.</p>
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
