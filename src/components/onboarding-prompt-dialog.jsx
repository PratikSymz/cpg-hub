import React, { useEffect } from "react";
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
import { useNavigate } from "react-router-dom";
import { ROLE_BRAND, ROLE_SERVICE } from "@/constants/roles.js";
import { useUser } from "@clerk/clerk-react";

export default function OnboardingPromptDialog({ open, setOpen, role }) {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const userRoles = Array.isArray(user?.unsafeMetadata?.roles)
    ? user.unsafeMetadata.roles
    : [];
  const alreadyHasRole = userRoles.includes(role);

  const title = alreadyHasRole
    ? `You're already onboarded as a ${formatRole(role)}`
    : `You're about to set your profile as a ${formatRole(role)}`;

  const message = alreadyHasRole
    ? role === ROLE_BRAND
      ? `You're already registered as a brand. Taking you to the job posting page...`
      : `You've already completed onboarding as a ${formatRole(role)}.`
    : `This will take you to the onboarding form to complete your ${formatRole(role)} profile.`;

  useEffect(() => {
    if (open && role === ROLE_BRAND && alreadyHasRole) {
      navigate("/post-job");
    }
  }, [open, role, alreadyHasRole]);

  const handleRedirect = async () => {
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
          <DialogDescription className="">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            className="cursor-pointer"
            size="default"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          {!alreadyHasRole && (
            <Button
              className="cursor-pointer"
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

function formatRole(role) {
  if (typeof role !== "string") return "";

  return role
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (str) => str.toUpperCase());
}
