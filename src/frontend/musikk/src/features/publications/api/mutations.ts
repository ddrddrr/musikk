import { api_client } from "@/api/axiosConf.ts";
import { getErrorDetail } from "@/api/errorUtils.ts";
import { UUID } from "@/api/types.ts";
import { publicationKeys } from "@/features/publications/api/queryKeys.ts";
import { ChatURLs, PublicationURLs } from "@/features/publications/api/urls.ts";
import { AttachmentType, Chat } from "@/features/publications/types.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PublicationPayload {
    content: string;
    attachment?: { type: AttachmentType; uuid: UUID };
    parent_uuid?: UUID;
}

// TODO: add type
async function createPublication(url: string, payload: PublicationPayload) {
    const response = await api_client.post(url, payload);
    return response.data;
}

interface CreatePostParams {
    userUUID: UUID;
    content: string;
    attachmentType?: AttachmentType;
    attachmentUUID?: UUID;
    parentUUID?: UUID;
}

export function useCreatePost() {
    const queryClient = useQueryClient();
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
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: publicationKeys.feed(variables.userUUID),
            });
            if (variables.parentUUID) {
                void queryClient.invalidateQueries({
                    queryKey: publicationKeys.childrenRoot(),
                });
            }
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to create post"));
        },
    });
}

interface CreateCollectionCommentParams {
    collectionUUID: UUID;
    content: string;
    parentUUID?: UUID;
}

export function useCreateCollectionComment() {
    const queryClient = useQueryClient();
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
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: publicationKeys.collectionComments(variables.collectionUUID),
            });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to add comment"));
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
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to create chat"));
        },
    });
}

interface CreateChatMessageParams {
    userUUID: UUID;
    chatUUID: UUID;
    content: string;
    attachmentType?: AttachmentType;
    attachmentUUID?: UUID;
}

export function useCreateChatMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            userUUID,
            chatUUID,
            content,
            attachmentType,
            attachmentUUID,
        }: CreateChatMessageParams) => {
            const payload: PublicationPayload = { content };

            if (attachmentType && attachmentUUID) {
                payload.attachment = { type: attachmentType, uuid: attachmentUUID };
            }

            await createPublication(ChatURLs.chatMessages(userUUID, chatUUID), payload);
        },
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: publicationKeys.chatMessages(variables.chatUUID),
            });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to send message"));
        },
    });
}

interface AddChatMembersParams {
    userUUID: UUID;
    chatUUID: UUID;
    participants: UUID[];
}

export function useAddChatMembers() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userUUID, chatUUID, participants }: AddChatMembersParams) => {
            await api_client.post(ChatURLs.chatMembers(userUUID, chatUUID), {
                participants,
            });
        },
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: publicationKeys.chatDetail(variables.chatUUID),
            });
        },
        onError: (error) => {
            toast.error(getErrorDetail(error, "Failed to add members"));
        },
    });
}
