import { Button } from "@/features/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface BackButtonProps {
    to?: string;
    label?: string;
    className?: string;
}

export function BackButton({ to, label = "Back", className }: BackButtonProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleClick = () => {
        if (to !== undefined) {
            void navigate(to);
            return;
        }
        // location.key === "default" means this is the first entry in the
        // session's history stack (e.g. deep link or hard refresh), so there is
        // no in-app page to go back to.
        if (location.key === "default") {
            void navigate("/");
        } else {
            void navigate(-1);
        }
    };

    return (
        <Button
            variant="ghost"
            onClick={handleClick}
            className={cn(
                "mb-6 flex items-center self-start text-foreground hover:underline",
                className,
            )}
        >
            <ChevronLeft className="mr-1" /> {label}
        </Button>
    );
}
