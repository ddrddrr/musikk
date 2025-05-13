import { IPublication, PublicationObjectType } from "@/components/publications/types.ts";
import { api } from "@/config/axiosConf.ts";
import { CommentURLs, PostURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";
import { useQuery } from "@tanstack/react-query";

export async function fetchCommentList(objType: PublicationObjectType, objUUID: string): Promise<IPublication[]> {
    const res = await api.get(CommentURLs.commentList(objType, objUUID));
    return res.data;
}

export function useUserPostsQuery(userUUID: UUID) {
    return useQuery<IPublication[]>({
        queryFn: async () => {
            const res = await api.get(PostURLs.userPostList(userUUID));
            return res.data;
        },
        queryKey: ["posts", "user", userUUID],
    });
}

export function usePostChildrenQuery(postUUID: UUID) {
    return useQuery<IPublication[]>({
        queryFn: async () => {
            const res = await api.get(PostURLs.postChildrenList(postUUID));
            return res.data;
        },
        queryKey: ["posts", "children", postUUID],
    });
}

export function usePostFetchQuery(postUUID: UUID) {
    return useQuery<IPublication[]>({
        queryFn: async () => {
            const res = await api.get(PostURLs.postRetrieve(postUUID));
            return res.data;
        },
        queryKey: ["posts", postUUID],
    });
}

export function usePostLatestFollowedQuery() {
    return useQuery<IPublication[]>({
        queryFn: async () => {
            const res = await api.get(PostURLs.postLatestFollowedList);
            return res.data;
        },
        queryKey: ["posts", "latest"],
    });
}
