import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "@/lib/utils";

const mediaBase =
    "bg-gray-200 flex items-center justify-center rounded-sm border border-black overflow-hidden";

type MediaProps = React.ComponentPropsWithoutRef<"div"> & {
    asChild?: boolean;
};

const MediaBox = React.forwardRef<HTMLDivElement, MediaProps>(
    ({ className, asChild = false, ...props }, ref) => {
        const Comp: React.ElementType = asChild ? Slot : "div";
        return (
            <Comp ref={ref} data-slot="media-box" className={cn(mediaBase, className)} {...props} />
        );
    },
);

MediaBox.displayName = "MediaBox";

export { MediaBox };
