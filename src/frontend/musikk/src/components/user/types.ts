import { URL, UUID } from "@/config/types.ts";
import { z } from "zod";

export interface IUser {
    uuid: UUID;
    email: string;
    display_name: string;
    avatar: URL;
    bio: string;
}

export const ProfileFormSchema = z.object({
    display_name: z.string().min(3),
    avatar: z.instanceof(File).optional(),
    bio: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;
