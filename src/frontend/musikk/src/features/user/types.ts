import { URL } from "@/api/types.ts";
import { BaseModel } from "@/features/common/types.ts";
import { z } from "zod";

export interface BaseUser extends BaseModel {
    kind?: "user";
    display_name: string;
    avatar: URL;
    bio: string;
    is_artist: boolean;
}

export const ProfileFormSchema = z.object({
    display_name: z
        .string()
        .min(3, { message: "Your name must be at least 3 characters." })
        .max(50, { message: "Your name can't be longer than 50 characters." }),
    avatar: z.instanceof(File).optional(),
    bio: z
        .string()
        .max(2000, { message: "Your bio can't be longer than 2000 characters." })
        .optional(),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export type ConnectionType = "friends" | "followed";
