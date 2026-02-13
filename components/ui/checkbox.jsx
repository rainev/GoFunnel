import * as React from "react";
import { cn } from "@/lib/utils";

function Checkbox({ className, checked, onCheckedChange, ...props }) {
  return (
    <input
      type="checkbox"
      className={cn("h-4 w-4 rounded border border-input text-primary focus:ring-2 focus:ring-ring", className)}
      checked={Boolean(checked)}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  );
}

export { Checkbox };
