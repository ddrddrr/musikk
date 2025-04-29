import { useQuery } from "@tanstack/react-query";
import { fetchCommentList } from "@/components/comments/queries.ts";

export function Profile(){
    const  { isPending, error, data } = useQuery({
        queryKey: ["comments", objUUID],
        queryFn: () => fetchCommentList(objType, objUUID),
    });
    return(
        <div></div>
        // avatar
        // display name
        // possible real name
        // recetnly played tracks
        // liked songs
        // added playlists
        // friends
        // feed, where a user can add tracks/albums and comments for them
        // edit button which takes to the edit profile form
    )
}