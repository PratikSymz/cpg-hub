import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLE_BRAND, ROLE_SERVICE } from "@/constants/roles.js";

export default function OnboardingPromptDialog({ open, setOpen, product }) {
  const navigate = useNavigate();
  const role = product.role;
  const message =
    role === ROLE_BRAND
      ? "In order to post a job, please set up your brand profile"
      : role === ROLE_SERVICE
      ? "This is a confirmation that you'll be setting up as a service"
      : "This is a confirmation that you'll be setting up as a talent";

  const handleRedirect = () => {
    setOpen(false);
    if (role === ROLE_BRAND) {
      navigate("/onboarding/brand");
    } else if (role === ROLE_SERVICE) {
      navigate("/onboarding/service");
    } else {
      navigate("/onboarding/talent");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="">
        <DialogHeader className="">
          <DialogTitle className="">Unlock</DialogTitle>
          <DialogDescription className="">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            className=""
            size="default"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className=""
            size="default"
            variant="default"
            onClick={handleRedirect}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
