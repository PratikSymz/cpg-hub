import { useUser } from "@clerk/clerk-react";

export const getUserRoles = (user) =>
  Array.isArray(user?.unsafeMetadata?.roles) ? user.unsafeMetadata.roles : [];

export const useUserRoles = () => {
  const { user } = useUser();
  return getUserRoles(user);
};

export const addRole = async (user, role) => {
  const roles = getUserRoles(user);
  if (roles.includes(role)) return roles;
  const next = [...roles, role];
  await user.update({ unsafeMetadata: { roles: next } });
  return next;
};
