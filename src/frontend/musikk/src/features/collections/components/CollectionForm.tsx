import { CollectionCreationFormValues } from "@/features/collections/hooks/useCollectionCreation.ts";
import { ImageField } from "@/features/common/ImageField.tsx";
import { Button } from "@/features/ui/button.tsx";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/features/ui/form.tsx";
import { Input } from "@/features/ui/input.tsx";
import { Switch } from "@/features/ui/switch.tsx";
import type { UseFormReturn } from "react-hook-form";

type CollectionFormProps = {
    form: UseFormReturn<CollectionCreationFormValues>;
    onSubmit: (data: CollectionCreationFormValues) => void | Promise<void>;
    onCancel?: () => void;
    isSubmitting: boolean;
    submitLabel?: string;
    showCancel?: boolean;
};

export function CollectionForm({
    form,
    onSubmit,
    onCancel,
    isSubmitting,
    submitLabel = "Create",
    showCancel = false,
}: CollectionFormProps) {
    return (
        <Form {...form}>
            <form
                onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
                className="flex flex-col gap-4"
            >
                <FormField
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Enter title" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Enter description (optional)" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-col gap-2">
                    <ImageField name="image" />
                </div>

                <FormField
                    name="private"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Visibility</FormLabel>
                            <div className="flex items-center gap-2 pt-2">
                                <FormControl>
                                    <Switch
                                        checked={!!field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="text-sm">Private</div>
                            </div>
                        </FormItem>
                    )}
                />

                <div className="flex gap-2 pt-4">
                    {showCancel && onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting ? "Creating..." : submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
