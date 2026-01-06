import { Button } from "@/features/ui/button.tsx";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function BackButton({ to = "/", label = "Back" }: { to?: string; label?: string }) {
    const navigate = useNavigate();
    return (
        <Button
            variant="ghost"
            onClick={() => navigate(to)}
            className="mb-6 flex items-center text-white hover:underline"
        >
            <ChevronLeft className="mr-1" /> {label}
        </Button>
    );
}
