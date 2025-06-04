import React from "react";
import { Input } from "@/components/ui/input.jsx";
import clsx from "clsx";

const NumberInput = React.forwardRef(
  ({ className, onKeyDown, ...props }, ref) => {
    return (
      <Input
        type="number"
        ref={ref}
        className={clsx(
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        onKeyDown={(e) => {
          if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
          }
          if (onKeyDown) onKeyDown(e); // Allow parent handlers
        }}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export default NumberInput;
