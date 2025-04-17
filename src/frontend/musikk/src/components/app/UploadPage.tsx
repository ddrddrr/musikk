import { Header } from "@/components/layout/Header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { SongUploadForm } from "@/components/upload/SongUploadForm.tsx";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UploadPage() {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col h-screen bg-gray-200">
            <Header />

            <div className="flex-1 bg-red-600 p-4 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="flex items-center text-white hover:underline mb-6"
                    >
                        <ChevronLeft className="mr-1" /> Back to Music
                    </Button>

                    <div className="bg-white p-6 rounded-md border-2 border-black">
                        <h1 className="text-2xl font-bold mb-6 text-center">Upload New Song</h1>
                        <SongUploadForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
