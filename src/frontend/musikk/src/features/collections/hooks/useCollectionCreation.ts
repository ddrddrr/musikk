import { getErrorDetail } from "@/api/errorUtils.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { createCollection } from "@/features/collections/api/mutations.ts";
import { CollectionCreationSchema } from "@/features/collections/schemas.ts";
import { Collection } from "@/features/collections/types.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export type CollectionCreationFormValues = z.infer<typeof CollectionCreationSchema>;

const DEFAULT_VALUES: CollectionCreationFormValues = {
    title: "",
    private: false,
    description: "",
    image: undefined,
};

type UseCollectionCreationOptions = {
    type: "playlist" | "album";
    onSuccess?: (collection: Collection) => void;
};

export function useCollectionCreation({ type, onSuccess }: UseCollectionCreationOptions) {
    const userUUID = useUserUUID();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CollectionCreationFormValues>({
        resolver: zodResolver(CollectionCreationSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const submit = useCallback(
        async (data: CollectionCreationFormValues) => {
            setIsSubmitting(true);

            try {
                const collection = await createCollection({
                    type,
                    private: data.private,
                    title: data.title,
                    description: data.description,
                    image: data.image,
                    authors: type === "album" ? [userUUID] : undefined,
                });

                form.reset(DEFAULT_VALUES);
                onSuccess?.(collection);
            } catch (error) {
                toast.error(getErrorDetail(error, "Failed to create collection"));
            } finally {
                setIsSubmitting(false);
            }
        },
        [form, type, userUUID, onSuccess],
    );

    return {
        form,
        submit,
        isSubmitting,
    };
}
