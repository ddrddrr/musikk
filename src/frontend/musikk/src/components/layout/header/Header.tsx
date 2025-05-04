import { NavigateToProfileButton } from "@/components/layout/header/NavigateToProfileButton";
import { NotificationBox } from "@/components/notifications/NotificationBox";
import { SearchBarWrapper } from "@/components/searchbar/SearchBarWrapper";
import { Button } from "@/components/ui/button";
import { Cog, Disc3, Upload } from "lucide-react";
import { memo } from "react";
import { useNavigate } from "react-router-dom";

export const Header = memo(function Header() {
    const navigate = useNavigate();

    return (
        <div className="flex justify-between items-center p-4 bg-red-600 text-white">
            <div className="flex-none">
                <Button variant="ghost" className="text-white" onClick={() => navigate("/")}>
                    <Disc3 />
                </Button>
            </div>

            <div className="flex-1 flex justify-center items-center">
                <div className="flex items-center space-x-2">
                    <SearchBarWrapper />
                    <h1 className="text-xl font-bold">Musikk</h1>
                </div>
            </div>

            <div className="flex-1 flex justify-end items-center gap-4">
                <NavigateToProfileButton />

                <NotificationBox />

                <Button variant="ghost" className="text-white" onClick={() => navigate("/settings")}>
                    <Cog />
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="border-white text-white bg-transparent hover:bg-red-700"
                    onClick={() => navigate("/upload")}
                >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                </Button>
            </div>
        </div>
    );
});
