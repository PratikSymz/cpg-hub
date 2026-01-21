import React, { useEffect } from "react";
import {
  Dialog,
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
    ? role === ROLE_BRAND
      ? "Ready to Post a Job"
      : `You're already onboarded as a ${formatRole(role)}`
    : role === ROLE_BRAND
      ? "Create a Brand Profile"
      : `Complete Your ${formatRole(role)} Profile`;

  const message = alreadyHasRole
    ? role === ROLE_BRAND
      ? "Taking you to the job posting page..."
      : `You've already completed onboarding as a ${formatRole(role)}.`
    : role === ROLE_BRAND
      ? "To post a job, you'll need to create a brand profile first. This only takes a minute!"
      : `This will take you to the onboarding form to complete your ${formatRole(role)} profile.`;

  useEffect(() => {
    if (open && role === ROLE_BRAND && alreadyHasRole) {
      navigate("/post-job");
    }
  }, [open, role, alreadyHasRole]);

  const handleRedirect = () => {
    setOpen(false);
    if (role === ROLE_BRAND) {
      navigate("/post-job");
    } else if (role === ROLE_SERVICE) {
      navigate("/onboarding/service");
    } else {
      navigate("/onboarding/talent");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="px-6 sm:px-8 py-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            size="default"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          {!alreadyHasRole && (
            <Button
              variant="default"
              size="default"
              onClick={handleRedirect}
              className="cursor-pointer"
            >
              {role === ROLE_BRAND ? "Get Started" : "Continue"}
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
