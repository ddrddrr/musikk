import { UUID } from "@/api/types.ts";
import { AlbumSongUploadSection } from "@/features/album-upload/components/AlbumSongUploadSection.tsx";
import { useUpdateCollection } from "@/features/collections/api/mutations.ts";
import { CollectionForm } from "@/features/collections/components/CollectionForm.tsx";
import { useCollectionCreation } from "@/features/collections/hooks/useCollectionCreation.ts";
import { Collection } from "@/features/collections/types.ts";
import { BackButton } from "@/features/common/BackButton.tsx";
import { useNavigate, useParams } from "react-router-dom";

export function AlbumUploadPage() {
    const navigate = useNavigate();
    // the album uuid lives in the URL, so a reload of the page resumes the upload
    const { albumUUID } = useParams<{ albumUUID: UUID }>();

    const { form, submit, isSubmitting } = useCollectionCreation({
        type: "album",
        onSuccess: (collection: Collection) => {
            void navigate(`/upload/${collection.uuid}`, { replace: true });
        },
    });

    const updateCollectionMutation = useUpdateCollection();

    const publishAlbum = (collectionUUID: UUID) => {
        updateCollectionMutation.mutate(
            { collectionUUID, input: { draft: false } },
            {
                onSuccess: (collection) => {
                    void navigate(`/collection/${collection.uuid}/`);
                },
            },
        );
    };

    return (
        <div className="flex-1 overflow-y-auto bg-brand p-4">
            <div className="mx-auto max-w-2xl">
                <BackButton to="/" label="Back to Music" className="text-brand-foreground" />

                <div className="rounded-sm border-2 border-foreground bg-card p-6">
                    {!albumUUID ? (
                        <>
                            <div className="mb-1 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Step 1 of 2
                            </div>
                            <h1 className="text-center text-2xl font-bold">Create New Album</h1>
                            <p className="mb-6 text-center text-sm text-muted-foreground">
                                Set up album details first, then upload songs in the next step.
                            </p>
                            <CollectionForm
                                form={form}
                                onSubmit={submit}
                                isSubmitting={isSubmitting}
                                submitLabel="Continue to Song Upload"
                            />
                        </>
                    ) : (
                        <>
                            <div className="mb-1 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Step 2 of 2
                            </div>
                            <h1 className="text-center text-2xl font-bold">Upload Songs</h1>
                            <p className="mb-6 text-center text-sm text-muted-foreground">
                                Add and upload all songs before creating the album.
                            </p>
                            <AlbumSongUploadSection
                                key={albumUUID}
                                albumUUID={albumUUID}
                                onComplete={() => publishAlbum(albumUUID)}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
