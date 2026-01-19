import { useState } from "react";
import { AttachmentObj, AttachmentType } from "@/features/publications/types.ts";
import { UUID } from "@/api/types.ts";

export function useAttachment() {
    const [attachedObj, setAttachedObj] = useState<AttachmentObj | undefined>(undefined);

    const getAttachmentData = ():
        | { attachmentType: AttachmentType; attachmentUUID: UUID }
        | { attachmentType: undefined; attachmentUUID: undefined } => {
        if (!attachedObj) {
            return { attachmentType: undefined, attachmentUUID: undefined };
        }

        let attachmentType: AttachmentType;
        switch (attachedObj.kind) {
            case "collection":
                attachmentType = "collection";
                break;
            case "collectionSong":
                attachmentType = "song";
                break;
            case "user":
                attachmentType = "user";
                break;
        }

        return {
            attachmentType,
            attachmentUUID: attachedObj.uuid,
        };
    };

    const clearAttachment = () => setAttachedObj(undefined);

    return {
        attachedObj,
        setAttachedObj,
        getAttachmentData,
        clearAttachment,
    };
}