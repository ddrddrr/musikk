import { Button } from "@/components/ui/button";
import { Home, Settings, Upload, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
    title?: string;
}

export function Header({ title = "Music Player" }: HeaderProps) {
    const navigate = useNavigate();

    return (
        <div className="flex justify-between p-4 bg-red-600 text-white">
            <div className="flex-1">
                <Button variant="ghost" className="text-white hover:text-gray-200 p-0" onClick={() => navigate("/")}>
                    <Home className="w-5 h-5 mr-1" />
                    Home
                </Button>
            </div>
            <div className="flex-1 flex justify-center">
                <h1 className="text-xl font-bold">{title}</h1>
            </div>
            <div className="flex-1 flex justify-end gap-4">
                <button className="hover:underline flex items-center">
                    <Home className="w-4 h-4 mr-1" />
                    *home*
                </button>
                <button className="hover:underline flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    *face*
                </button>
                <button className="hover:underline flex items-center">
                    <Settings className="w-4 h-4 mr-1" />
                    *settings*
                </button>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-2 border-black text-white bg-transparent hover:bg-red-700"
                    onClick={() => navigate("/upload")}
                >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                </Button>
            </div>
        </div>
    );
}
