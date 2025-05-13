import { PublicationObjectType } from "@/components/publications/types.ts";
import { api } from "@/config/axiosConf.ts";
import { CommentURLs, PostURLs } from "@/config/endpoints.ts";
import { useMutation } from "@tanstack/react-query";

interface IAddCommentParams {
    objType: PublicationObjectType;
    objUUID: string;
    content: string;
    replyToUUID: string | undefined;
}

export async function commentCreate({ objType, objUUID, content, replyToUUID }: IAddCommentParams) {
    const data = {
        content,
        parent: replyToUUID,
    };
    await api.post(CommentURLs.commentCreate(objType, objUUID), data);
}

interface IUserPostCreateParams {
    objType?: PublicationObjectType;
    objUUID?: string;
    content: string;
    replyToUUID: string | undefined;
}

export function useUserPostCreateMutation() {
    return useMutation({
        mutationFn: async ({ ...params }: IUserPostCreateParams) => {
            const data = {
                content: params.content,
                obj_type: params.objType,
                obj_uuid: params.objUUID,
                parent: params.replyToUUID,
            };
            api.post(PostURLs.postCreate, data);
        },
    });
}
