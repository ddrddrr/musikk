import { BackButton } from "@/components/common/BackButton.tsx";
import { Header } from "@/components/layout/Header.tsx";
import { SongUploadForm } from "@/components/upload/SongUploadForm.tsx";

export function UploadPage() {
    return (
        <div className="flex flex-col h-screen bg-gray-200">
            <Header />

            <div className="flex-1 bg-red-600 p-4 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <BackButton to="/" label="Back to Music" />

                    <div className="bg-white p-6 rounded-sm border-2 border-black">
                        <h1 className="text-2xl font-bold mb-6 text-center">Upload New Song</h1>
                        <SongUploadForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
