import { CollectionUploadFormValues, SongUploadState } from "@/components/upload/types.ts";
import { useCallback } from "react";
import { UseFormSetValue } from "react-hook-form";

export function useHandleUploadEvent(
    setUploadStatuses: React.Dispatch<React.SetStateAction<SongUploadState[]>>,
    setFormValue: UseFormSetValue<CollectionUploadFormValues>,
) {
    return useCallback(
        (event: MessageEvent) => {
            const { operation_id: uploadId, status } = JSON.parse(event.data);
            setUploadStatuses((prev) => {
                const idx = prev.findIndex((s) => s.uploadId === uploadId);

                // TODO: handle somehow...
                // event can come in before the BE send 202 response
                if (idx === -1) return [...prev, { uuid: uploadId, status }];

                // clone and update only the matching item
                const updated = [...prev];
                updated[idx] = { ...updated[idx], status };

                if (status === "success") {
                    setFormValue(`songs.${idx}.uuid`, uploadId);
                }

                return updated;
            });
        },
        [setUploadStatuses, setFormValue],
    );
}
