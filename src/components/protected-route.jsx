/* eslint-disable react/prop-types */
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useUserRoles } from "@/hooks/use-user-roles.jsx";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded, user } = useUser();
  const { pathname } = useLocation();
  const roles = useUserRoles();

  if (isLoaded && !isSignedIn && isSignedIn !== undefined) {
    return <Navigate to="/" />;
  }

  if (user !== undefined && roles.length === 0 && pathname !== "/") {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
