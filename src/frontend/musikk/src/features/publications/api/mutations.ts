import { api_client } from "@/api/axiosConf.ts";
import { PublicationURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { AttachmentType, PublicationForType } from "@/features/publications/types.ts";
import { useMutation } from "@tanstack/react-query";

interface IPublicationCreateParams {
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
}: IPublicationCreateParams) {
    await api_client.post(PublicationURLs.publicationCreate(obj_type, obj_uuid), {
        content,
        obj_type,
        obj_uuid,
        attachment_type,
        attachment_uuid,
        parent_uuid,
    });
}

export function usePublicationCreateMutation() {
    return useMutation({
        mutationFn: publicationCreate,
    });
}
