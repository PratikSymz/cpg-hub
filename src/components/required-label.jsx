// components/ui/required-label.jsx
import React from "react";
import { Label } from "@/components/ui/label.jsx";

const RequiredLabel = ({ children, className = "" }) => (
  <Label className={className}>
    {children} <span className="text-red-500">*</span>
  </Label>
);

export default RequiredLabel;
