import { BackButton } from "@/features/common/BackButton.tsx";
import { Header } from "@/features/layout/header/Header.tsx";
import { CollectionUploadForm } from "@/features/upload/CollectionUploadForm.tsx";

// TODO: only artists should have access
export function UploadPage() {
    return (
        <div className="flex h-screen flex-col bg-gray-200">
            <Header />

            <div className="flex-1 overflow-y-auto bg-red-600 p-4">
                <div className="mx-auto max-w-2xl">
                    <BackButton to="/" label="Back to Music" />

                    <div className="rounded-sm border-2 border-black bg-white p-6">
                        <h1 className="mb-6 text-center text-2xl font-bold">
                            Upload New Song or Collection
                        </h1>
                        <CollectionUploadForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
