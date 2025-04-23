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

  if (user !== undefined && !user?.unsafeMetadata?.role && pathname !== "/")
    return <Navigate to="/" />;

  return children;
};

export default ProtectedRoute;
