import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * MediaBox
 *
 * Small wrapper for thumbnails / media images used throughout the app.
 * - Provides the common visual shell: bg-gray-200, border, rounded, centering and overflow-hidden.
 * - Consumers control exact sizing via className (e.g. w-10 h-10, w-full h-60).
 * - Supports asChild to wrap an <img /> or other element.
 */

const mediaBase = "bg-gray-200 flex items-center justify-center rounded-sm border border-black overflow-hidden";

type MediaProps = React.ComponentPropsWithoutRef<"div"> & {
  asChild?: boolean;
};

const MediaBox = React.forwardRef<HTMLDivElement, MediaProps>(({ className, asChild = false, ...props }, ref) => {
  const Comp: React.ElementType = asChild ? Slot : "div";
  return <Comp ref={ref} data-slot="media-box" className={cn(mediaBase, className)} {...props} />;
});

MediaBox.displayName = "MediaBox";

export { MediaBox };
