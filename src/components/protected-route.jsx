/* eslint-disable react/prop-types */
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded, user } = useUser();
  const { pathname } = useLocation();

  if (isLoaded && !isSignedIn && isSignedIn !== undefined) {
    return <Navigate to="/" />;
  }

  // Check if user has completed onboarding (has at least one role)
  const roles = user?.unsafeMetadata?.roles;
  const hasRoles = Array.isArray(roles) && roles.length > 0;

  if (user !== undefined && !hasRoles && pathname !== "/") {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
