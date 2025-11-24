import { api_client } from "@/api/axiosConf.ts";
import { CommentURLs, PostURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { IPublication, PublicationObjectType } from "@/modules/publications/types.ts";
import { useQuery } from "@tanstack/react-query";

export async function fetchCommentList(objType: PublicationObjectType, objUUID: string): Promise<IPublication[]> {
    const res = await api_client.get(CommentURLs.commentList(objType, objUUID));
    return res.data;
}

export function useUserPostsQuery(userUUID: UUID) {
    return useQuery<IPublication[]>({
        queryFn: async () => {
            const res = await api_client.get(PostURLs.userPostList(userUUID));
            return res.data;
        },
        queryKey: ["posts", "user", userUUID],
    });
}

export function usePostChildrenQuery(postUUID: UUID) {
    return useQuery<IPublication[]>({
        queryFn: async () => {
            const res = await api_client.get(PostURLs.postChildrenList(postUUID));
            return res.data;
        },
        queryKey: ["posts", "children", postUUID],
    });
}

export function usePostFetchQuery(postUUID: UUID) {
    return useQuery<IPublication[]>({
        queryFn: async () => {
            const res = await api_client.get(PostURLs.postRetrieve(postUUID));
            return res.data;
        },
        queryKey: ["posts", postUUID],
    });
}
