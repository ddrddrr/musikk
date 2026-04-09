import { UUID } from "@/api/types.ts";
import { Collection } from "@/features/collections/types.ts";
import { BackButton } from "@/features/common/BackButton.tsx";
import { Header } from "@/features/layout/header/Header.tsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlbumSongUploadSection } from "../collections/components/AlbumSongUploadSection.tsx";
import { CollectionForm } from "../collections/components/CollectionForm.tsx";
import { useCollectionCreation } from "../collections/hooks/useCollectionCreation.ts";

export function AlbumUploadPage() {
    const navigate = useNavigate();
    const [albumUUID, setAlbumUUID] = useState<UUID | null>(null);

    const { form, submit, isSubmitting } = useCollectionCreation({
        type: "album",
        onSuccess: (collection: Collection) => {
            setAlbumUUID(collection.uuid);
        },
    });

    return (
        <div className="flex h-screen flex-col bg-muted">
            {/*TODO: should just stay rendered once, not redeclared here as well...*/}
            <Header />

            <div className="flex-1 overflow-y-auto bg-brand p-4">
                <div className="mx-auto max-w-2xl">
                    <BackButton to="/" label="Back to Music" />

                    <div className="rounded-sm border-2 border-foreground bg-card p-6">
                        {!albumUUID ? (
                            <>
                                <h1 className="mb-6 text-center text-2xl font-bold">
                                    Create New Album
                                </h1>
                                <CollectionForm
                                    form={form}
                                    onSubmit={submit}
                                    isSubmitting={isSubmitting}
                                    submitLabel="Create Album"
                                />
                            </>
                        ) : (
                            <>
                                <h1 className="mb-6 text-center text-2xl font-bold">
                                    Upload Songs to Album
                                </h1>
                                <AlbumSongUploadSection
                                    albumUUID={albumUUID}
                                    onComplete={() => {
                                        navigate(`/collection/${albumUUID}/`);
                                    }}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
