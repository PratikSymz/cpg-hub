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
import { ROLE_BRAND, ROLE_SERVICE, ROLE_TALENT } from "@/constants/roles.js";

export default function OnboardingPromptDialog({
  open,
  setOpen,
  role,
  currentRole,
  isFirstTime,
}) {
  const navigate = useNavigate();

  const title = isFirstTime
    ? `You're about to set your profile as a ${role}`
    : `You're already registered as a ${currentRole}.`;

  const message = isFirstTime
    ? ``
    : `You can't switch roles once you've onboarded. Please continue using the platform as a ${currentRole}.`;

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
          <DialogTitle className="">{title}</DialogTitle>
          <DialogDescription className="">
            {message}
          </DialogDescription>
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
          {isFirstTime && (
            <Button
              className=""
              size="default"
              variant="default"
              onClick={handleRedirect}
            >
              Continue
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
