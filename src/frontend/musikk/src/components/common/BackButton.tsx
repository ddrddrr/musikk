import { Button } from "@/components/ui/button.tsx";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function BackButton({ to = "/", label = "Back" }: { to?: string; label?: string }) {
    const navigate = useNavigate();
    return (
        <Button
            variant="ghost"
            onClick={() => navigate(to)}
            className="flex items-center text-white hover:underline mb-6"
        >
            <ChevronLeft className="mr-1" /> {label}
        </Button>
    );
}
