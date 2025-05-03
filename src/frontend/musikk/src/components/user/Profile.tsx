import { Avatar, AvatarImage } from "@/components/ui/avatar.tsx";
import { UserContext } from "@/providers/userContext.ts";
import { useContext } from "react";

export function Profile() {
    const { user } = useContext(UserContext);
    if (!user) return null;
    // add router, make it /users/<uuid>
    return (
        <>
            <Avatar className="rounded-sm w-10 h-10">
                <AvatarImage src={user?.avatar} alt={user?.display_name} className="object-cover" />
            </Avatar>
            <div>{user.display_name}</div>
            <div>{user.bio}</div>
            {/*onclick - open profile edit popover*/}
            <button></button>
            {/*// display name // recently played tracks // friends // feed, where a user can add tracks/albums and*/}
            {/*comments for them // edit button which takes to the edit profile form*/}
        </>
    );
}
