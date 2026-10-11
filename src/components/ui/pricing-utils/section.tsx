import * as React from "react";

import { cn } from "@/lib/utils";

export function Section({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("w-full py-4", className)} {...props}>
      {children}
    </section>
  );
}
