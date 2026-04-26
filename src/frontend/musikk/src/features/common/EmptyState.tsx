import { cn } from "@/lib/utils.ts";
import { cva, type VariantProps } from "class-variance-authority";

const emptyStateVariants = cva("text-center text-sm text-muted-foreground", {
    variants: {
        variant: {
            bordered: "rounded-sm border-2 border-foreground bg-muted p-6",
            inline: "py-4",
        },
    },
    defaultVariants: {
        variant: "bordered",
    },
});

type EmptyStateProps = {
    message?: string;
    className?: string;
} & VariantProps<typeof emptyStateVariants>;

export function EmptyState({ message = "Nothing here yet", variant, className }: EmptyStateProps) {
    return <p className={cn(emptyStateVariants({ variant }), className)}>{message}</p>;
}
