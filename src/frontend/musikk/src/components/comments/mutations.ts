import { CommentObjectType } from "@/components/comments/types.ts";
import { api } from "@/config/axiosConf.ts";
import { CommentURLs } from "@/config/endpoints.ts";

interface IAddCommentParams {
    objType: CommentObjectType;
    objUUID: string;
    content: string;
}

export async function addComment({ objType, objUUID, content }: IAddCommentParams) {
    await api.post(CommentURLs.commentCreate, {
        "obj-type": objType,
        "obj-uuid": objUUID,
        content,
    });
}
