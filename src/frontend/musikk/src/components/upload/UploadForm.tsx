import { Form } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { CollectionUpload } from "@/components/upload/CollectionUpload";
import { SongUpload } from "@/components/upload/SongUpload";
import { CollectionFormValues, FormSchema } from "@/components/upload/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";

export function UploadForm() {
    const form = useForm<CollectionFormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            isCollectionMode: true,
            private: false,
            songs: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "songs",
    });

    const isCollectionMode = form.watch("isCollectionMode");
    return (
        <div className="p-4 max-h-screen overflow-y-auto">
            <Form {...form}>
                <div className="flex items-center space-x-2 mb-4">
                    <label className="flex items-center">
                        <span>Collection Mode</span>
                        <Switch
                            checked={isCollectionMode}
                            onCheckedChange={(v) => form.setValue("isCollectionMode", v)}
                            className="ml-2"
                        />
                    </label>
                </div>

                {isCollectionMode ? (
                    <CollectionUpload form={form} fields={fields} append={append} remove={remove} />
                ) : (
                    <SongUpload form={form} fields={fields} append={append} remove={remove} />
                )}
            </Form>
        </div>
    );
}
