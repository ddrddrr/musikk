import { api_client } from "@/api/axiosConf.ts";
import { PublicationURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { AttachmentType, PublicationForType } from "@/features/publications/types.ts";
import { useMutation } from "@tanstack/react-query";

interface PublicationCreateParams {
    content: string;
    obj_type: PublicationForType;
    obj_uuid: UUID;
    attachment_type?: AttachmentType;
    attachment_uuid?: UUID;
    parent_uuid?: UUID;
}

export async function publicationCreate({
    content,
    obj_type,
    obj_uuid,
    attachment_type,
    attachment_uuid,
    parent_uuid,
}: PublicationCreateParams) {
    const payload: {
        content: string;
        attachment?: { type: string; uuid: string };
        parent_uuid?: UUID;
    } = {
        content,
    };

    if (attachment_type && attachment_uuid) {
        payload.attachment = {
            type: attachment_type,
            uuid: attachment_uuid,
        };
    }

    if (parent_uuid) {
        payload.parent_uuid = parent_uuid;
    }

    await api_client.post(PublicationURLs.publicationCreate(obj_type, obj_uuid), payload);
}

export function usePublicationCreateMutation() {
    return useMutation({
        mutationFn: publicationCreate,
    });
}
