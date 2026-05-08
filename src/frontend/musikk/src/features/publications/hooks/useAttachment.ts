import { UUID } from "@/api/types.ts";
import { AttachmentObj, AttachmentType } from "@/features/publications/types.ts";
import { useState } from "react";

export function useAttachment() {
    const [attachedObj, setAttachedObj] = useState<AttachmentObj | undefined>(undefined);

    const getAttachmentData = ():
        | { attachmentType: AttachmentType; attachmentUUID: UUID }
        | { attachmentType: undefined; attachmentUUID: undefined } => {
        if (!attachedObj) {
            return { attachmentType: undefined, attachmentUUID: undefined };
        }

        const attachmentUUID = attachedObj.uuid;
        switch (attachedObj.kind) {
            case "collection":
                return { attachmentType: "collection", attachmentUUID };
            case "collectionSong":
                return { attachmentType: "song", attachmentUUID };
            case "user":
                return { attachmentType: "user", attachmentUUID };
            default:
                throw new Error(`Unsupported attachment: ${String(attachedObj.kind)}`);
        }
    };

    const clearAttachment = () => setAttachedObj(undefined);

    return {
        attachedObj,
        setAttachedObj,
        getAttachmentData,
        clearAttachment,
    };
}
