import { api_client } from "@/api/axiosConf.ts";
import { UUID } from "@/api/types.ts";
import { ChatURLs, PublicationURLs } from "@/features/publications/api/endpoints.ts";
import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { AttachmentRef, Chat, Publication } from "@/features/publications/types.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PublicationPayload {
    content: string;
    attachment?: AttachmentRef;
    parent_uuid?: UUID;
}

export interface PublicationDraft {
    content: string;
    attachment?: AttachmentRef;
}

interface PublicationInput extends PublicationDraft {
    parentUUID?: UUID;
}

function buildPublicationPayload({
    content,
    attachment,
    parentUUID,
}: PublicationInput): PublicationPayload {
    const payload: PublicationPayload = { content };
    if (attachment) {
        payload.attachment = attachment;
    }
    if (parentUUID) {
        payload.parent_uuid = parentUUID;
    }
    return payload;
}

async function createPublication(url: string, payload: PublicationPayload): Promise<Publication> {
    const response = await api_client.post<Publication>(url, payload);
    return response.data;
}

interface CreatePostParams extends PublicationInput {
    userUUID: UUID;
}

export function useCreatePost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userUUID, ...input }: CreatePostParams) => {
            await createPublication(
                PublicationURLs.feedPosts(userUUID),
                buildPublicationPayload(input),
            );
        },
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: publicationKeys.feed(variables.userUUID),
            });
            void queryClient.invalidateQueries({
                queryKey: publicationKeys.globalFeeds(),
            });
            if (variables.parentUUID) {
                void queryClient.invalidateQueries({
                    queryKey: publicationKeys.allChildren(),
                });
            }
        },
    });
}

interface CreateCollectionCommentParams extends PublicationInput {
    collectionUUID: UUID;
}

export function useCreateCollectionComment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ collectionUUID, ...input }: CreateCollectionCommentParams) => {
            await createPublication(
                PublicationURLs.collectionComments(collectionUUID),
                buildPublicationPayload(input),
            );
        },
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: publicationKeys.collectionComments(variables.collectionUUID),
            });
        },
    });
}

interface CreateChatParams {
    userUUID: UUID;
    participants: UUID[];
    isDirect: boolean;
    title?: string;
    image?: File;
}

export function useCreateChat() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            userUUID,
            participants,
            isDirect,
            title,
            image,
        }: CreateChatParams): Promise<Chat> => {
            const formData = new FormData();

            participants.forEach((uuid) => {
                formData.append("participants", uuid);
            });
            formData.append("is_direct", String(isDirect));

            if (title) {
                formData.append("title", title);
            }
            if (image) {
                formData.append("image", image);
            }

            const response = await api_client.post<Chat>(ChatURLs.userChats(userUUID), formData);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: publicationKeys.userChats(variables.userUUID),
            });
        },
    });
}

interface CreateChatMessageParams extends PublicationDraft {
    userUUID: UUID;
    chatUUID: UUID;
}

export function useCreateChatMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userUUID, chatUUID, ...draft }: CreateChatMessageParams) => {
            await createPublication(
                ChatURLs.chatMessages(userUUID, chatUUID),
                buildPublicationPayload(draft),
            );
        },
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: publicationKeys.chatMessages(variables.userUUID, variables.chatUUID),
            });
            void queryClient.invalidateQueries({
                queryKey: publicationKeys.userChats(variables.userUUID),
            });
        },
    });
}
