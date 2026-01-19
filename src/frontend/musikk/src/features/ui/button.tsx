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
                brand: "bg-red-600 hover:bg-red-700 text-white border-2 border-black",
                muted: "bg-gray-200 hover:bg-gray-300 text-black border-2 border-black",
                accent: "bg-blue-500 hover:bg-blue-600 text-white border-2 border-black",
                ghost: "bg-transparent text-primary hover:bg-accent/60",
                destructive: "bg-destructive text-white",
                outline:
                    "bg-background text-black hover:bg-gray-100 hover:border-gray-300 border-2",
                link: "underline text-primary bg-transparent p-0",
            },
            size: {
                default: "h-9 px-4",
                sm: "h-8 px-3 text-sm",
                lg: "h-10 px-6 text-base",
                icon: "h-9 w-9 p-0",
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
