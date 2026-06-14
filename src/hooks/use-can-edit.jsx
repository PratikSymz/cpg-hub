import { useUser } from "@clerk/clerk-react";
import { isAdminEmail } from "@/constants/admins";

export const useCanEdit = (resourceUserId) => {
  const { user, isSignedIn } = useUser();
  const isOwner = !!isSignedIn && !!resourceUserId && resourceUserId === user?.id;
  const isAdmin =
    !!isSignedIn && isAdminEmail(user?.primaryEmailAddress?.emailAddress);
  return { isOwner, isAdmin, canEdit: isOwner || isAdmin };
};
