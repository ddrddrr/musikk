import { CommentObjectType, IComment } from "@/components/comments/types.ts";
import { api } from "@/config/axiosConf.ts";
import { CommentURLs } from "@/config/endpoints.ts";

export async function fetchCommentList(objType: CommentObjectType, objUUID: string): Promise<IComment[]> {
    const res = await api.get(CommentURLs.commentList(objType, objUUID));
    return res.data;
}
