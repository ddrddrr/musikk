import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm" +
        " text-sm font-medium transition-colors disabled:pointer-events-none " +
        "disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground",
                brand: "bg-brand hover:bg-brand-hover text-brand-foreground border-2 border-foreground",
                muted: "bg-muted hover:bg-muted-hover text-foreground border-2 border-foreground",
                accent: "bg-info hover:bg-info-hover text-info-foreground border-2 border-foreground",
                ghost: "bg-transparent text-primary hover:bg-muted-hover",
                destructive: "bg-destructive text-destructive-foreground",
                outline:
                    "bg-background text-foreground hover:bg-muted-hover hover:border-border border-2",
                link: "bg-transparent text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4",
                sm: "h-8 px-3 text-sm",
                lg: "h-10 px-6 text-base",
                icon: "size-9 p-0",
                fit: "h-auto px-2 py-1",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

type ButtonProps = React.ComponentPropsWithoutRef<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp: React.ElementType = asChild ? Slot : "button";

        return (
            <Comp
                ref={ref}
                data-slot="button"
                className={cn(buttonVariants({ variant, size }), className)}
                {...props}
            />
        );
    },
);

Button.displayName = "Button";

export { Button, buttonVariants };
