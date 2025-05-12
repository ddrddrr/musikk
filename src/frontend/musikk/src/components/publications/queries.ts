import { IPost, IPublication, PublicationObjectType } from "@/components/publications/types.ts";
import { api } from "@/config/axiosConf.ts";
import { CommentURLs, PostURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";
import { useQuery } from "@tanstack/react-query";

export async function fetchCommentList(objType: PublicationObjectType, objUUID: string): Promise<IPublication[]> {
    const res = await api.get(CommentURLs.commentList(objType, objUUID));
    return res.data;
}

export function useUserPostsFetchQuery(userUUID: UUID) {
    return useQuery<IPost[]>({
        queryFn: async () => {
            const res = await api.get(PostURLs.userPostList(userUUID));
            return res.data;
        },
        queryKey: ["posts", userUUID],
    });
}
