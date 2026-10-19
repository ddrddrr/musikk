import { AttachmentObj, AttachmentRef } from "@/features/publications/types.ts";
import { useState } from "react";

export function useAttachment() {
    const [attachedObj, setAttachedObj] = useState<AttachmentObj | undefined>(undefined);

    const getAttachment = (): AttachmentRef | undefined => {
        if (!attachedObj) {
            return undefined;
        }

        const uuid = attachedObj.uuid;
        switch (attachedObj.kind) {
            case "collection":
                return { type: "collection", uuid };
            case "collectionSong":
                return { type: "song", uuid };
            case "user":
                return { type: "user", uuid };
            default:
                throw new Error(`Unsupported attachment: ${String(attachedObj.kind)}`);
        }
    };

    const clearAttachment = () => setAttachedObj(undefined);

    return {
        attachedObj,
        setAttachedObj,
        getAttachment,
        clearAttachment,
    };
}
