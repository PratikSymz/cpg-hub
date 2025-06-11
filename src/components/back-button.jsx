import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { ArrowLeft } from "lucide-react";

const BackButton = ({ className = "" }) => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate(-1)}
      size="default"
      variant="ghost"
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <p className="hover:underline">Back</p>
    </Button>
  );
};

export default BackButton;
