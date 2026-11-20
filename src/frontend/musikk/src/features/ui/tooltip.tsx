import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

function TooltipProvider({
    delayDuration = 300,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
    return (
        <TooltipPrimitive.Provider
            data-slot="tooltip-provider"
            delayDuration={delayDuration}
            {...props}
        />
    );
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
    return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
    className,
    sideOffset = 6,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                className={cn(
                    "z-50 origin-(--radix-tooltip-content-transform-origin) rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                    className,
                )}
                {...props}
            />
        </TooltipPrimitive.Portal>
    );
}

type IconTooltipProps = {
    label: string;
    children: React.ReactNode;
    side?: React.ComponentProps<typeof TooltipPrimitive.Content>["side"];
};

function IconTooltip({ label, children, side = "bottom" }: IconTooltipProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side={side}>{label}</TooltipContent>
        </Tooltip>
    );
}

type OverflowTooltipProps = {
    label: string;
    children: React.ReactElement;
};

/**
 * Shows the full text when the child cuts it off with `truncate` or `line-clamp`. The child must be the
 * element that hides the overflow, because that element is measured. Text that fits gets no tooltip.
 */
function OverflowTooltip({ label, children }: OverflowTooltipProps) {
    return (
        <Tooltip>
            <TooltipTrigger
                asChild
                onPointerMove={preventOpenUnlessCut}
                onFocus={preventOpenUnlessCut}
            >
                {children}
            </TooltipTrigger>
            <TooltipContent className="max-w-sm break-words">{label}</TooltipContent>
        </Tooltip>
    );
}

/**
 * Radix skips its own open handler when an earlier handler calls `preventDefault`. A controlled `open`
 * prop does not work here, because Radix would still count the blocked tooltip as open, and the next
 * tooltip would then open without its delay.
 */
function preventOpenUnlessCut(event: React.SyntheticEvent<HTMLElement>) {
    const element = event.currentTarget;
    const isCut =
        element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
    if (!isCut) {
        event.preventDefault();
    }
}

export { IconTooltip, OverflowTooltip, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
