import { CommentObjectType } from "@/components/comments/types.ts";
import { api } from "@/config/axiosConf.ts";
import { CommentURLs } from "@/config/endpoints.ts";

interface IAddCommentParams {
    objType: CommentObjectType;
    objUUID: string;
    content: string;
    replyToUUID: string | undefined;
}

export async function addComment({ objType, objUUID, content, replyToUUID }: IAddCommentParams) {
    const data = {
        "obj-type": objType,
        "obj-uuid": objUUID,
        content,
        parent: replyToUUID,
    };
    await api.post(CommentURLs.commentCreate, data);
}
