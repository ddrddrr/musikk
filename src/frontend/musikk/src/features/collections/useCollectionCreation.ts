import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { createCollection } from "@/features/collections/api/mutations.ts";
import { CollectionCreationSchema } from "@/features/collections/schemas.ts";
import { Collection, CollectionType } from "@/features/collections/types.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export type CollectionCreationFormValues = z.infer<typeof CollectionCreationSchema>;

const DEFAULT_VALUES: CollectionCreationFormValues = {
    title: "",
    private: false,
    description: "",
    image: undefined,
};

type UseCollectionCreationOptions = {
    type: CollectionType;
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
                    // todo
                    type,
                    private: data.private,
                    title: data.title,
                    description: data.description,
                    image: data.image,
                    authors: [userUUID],
                });

                form.reset(DEFAULT_VALUES);
                onSuccess?.(collection);
            } catch (error) {
                console.warn("createCollection failed", error);
                throw error;
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
