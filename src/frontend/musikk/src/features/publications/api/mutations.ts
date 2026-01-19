import { api_client } from "@/api/axiosConf.ts";
import { UUID } from "@/api/types.ts";
import { PublicationURLs } from "@/features/publications/api/urls.ts";
import { AttachmentType } from "@/features/publications/types.ts";
import { useMutation } from "@tanstack/react-query";

interface PublicationPayload {
    content: string;
    attachment?: { type: AttachmentType; uuid: UUID };
    parent_uuid?: UUID;
}

async function createPublication(url: string, payload: PublicationPayload) {
    await api_client.post(url, payload);
}

interface CreatePostParams {
    userUUID: UUID;
    content: string;
    attachmentType?: AttachmentType;
    attachmentUUID?: UUID;
    parentUUID?: UUID;
}

export function useCreatePost() {
    return useMutation({
        mutationFn: async ({
            userUUID,
            content,
            attachmentType,
            attachmentUUID,
            parentUUID,
        }: CreatePostParams) => {
            const payload: PublicationPayload = { content };

            if (attachmentType && attachmentUUID) {
                payload.attachment = { type: attachmentType, uuid: attachmentUUID };
            }

            if (parentUUID) {
                payload.parent_uuid = parentUUID;
            }

            await createPublication(PublicationURLs.feedPosts(userUUID), payload);
        },
    });
}

interface CreateCollectionCommentParams {
    collectionUUID: UUID;
    content: string;
    parentUUID?: UUID;
}

export function useCreateCollectionComment() {
    return useMutation({
        mutationFn: async ({
            collectionUUID,
            content,
            parentUUID,
        }: CreateCollectionCommentParams) => {
            const payload: PublicationPayload = { content };

            if (parentUUID) {
                payload.parent_uuid = parentUUID;
            }

            await createPublication(PublicationURLs.collectionComments(collectionUUID), payload);
        },
    });
}
