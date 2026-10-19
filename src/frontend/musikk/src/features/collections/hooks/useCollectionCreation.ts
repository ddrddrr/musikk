import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useCreateCollection } from "@/features/collections/api/mutations.ts";
import { CollectionCreationSchema } from "@/features/collections/schemas.ts";
import { Collection } from "@/features/collections/types.ts";
import { zodResolver } from "@hookform/resolvers/zod";
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
    type: "playlist" | "album";
    onSuccess?: (collection: Collection) => void;
};

export function useCollectionCreation({ type, onSuccess }: UseCollectionCreationOptions) {
    const userUUID = useUserUUID();
    const createCollection = useCreateCollection();

    const form = useForm<CollectionCreationFormValues>({
        resolver: zodResolver(CollectionCreationSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const submit = (data: CollectionCreationFormValues) => {
        createCollection.mutate(
            {
                type,
                private: data.private,
                title: data.title,
                description: data.description,
                image: data.image,
                authors: type === "album" ? [userUUID] : undefined,
                draft: type === "album",
            },
            {
                onSuccess: (collection) => {
                    form.reset(DEFAULT_VALUES);
                    onSuccess?.(collection);
                },
            },
        );
    };

    return {
        form,
        submit,
        isSubmitting: createCollection.isPending,
    };
}
