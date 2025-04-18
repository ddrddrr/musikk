import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { uploadSong } from "@/components/upload/mutations.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

const SongSchema = z.object({
    title: z.string().min(1),
    audio: z.instanceof(File).optional(),
    description: z.string().min(0),
    image: z.instanceof(File).optional(),
});

const FormSchema = z.object({
    songs: z.array(SongSchema),
});

// TODO: add dropzone support
export function SongUploadForm() {
    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: { songs: [{ title: "", description: "", audio: undefined }] },
    });
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "songs" });
    const [fieldStatuses, setFieldStatuses] = useState<Record<number, boolean>>({});
    const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});

    const mutation = useMutation({
        mutationFn: uploadSong,
    });

    const onSubmit = async (values: z.infer<typeof FormSchema>) => {
        const newStatuses: Record<number, boolean> = { ...fieldStatuses };

        await Promise.allSettled(
            values.songs.map(async (song, index) => {
                if (fieldStatuses[index]) return; // already uploaded successfully

                try {
                    if (!song.audio) {
                        newStatuses[index] = false;
                        return;
                    }
                    await mutation.mutateAsync(song);
                    newStatuses[index] = true;
                } catch {
                    newStatuses[index] = false;
                }
            }),
        );

        setFieldStatuses(newStatuses);
    };

    const handleImageChange = (index: number, file?: File) => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrls((prev) => ({ ...prev, [index]: url }));
        }
    };

    return (
        <div className="max-h-screen overflow-y-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className={`bg-white p-6 rounded-md border-2 border-black space-y-4 ${
                                fieldStatuses[index] ? "border-green-600" : "border-red-600"
                            }`}
                        >
                            <FormField
                                control={form.control}
                                name={`songs.${index}.title`}
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-lg font-bold">Title</FormLabel>
                                        <FormControl>
                                            <div className="bg-gray-200 p-2 border-2 border-black">
                                                <Input
                                                    {...field}
                                                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                                                    placeholder="Enter song title"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`songs.${index}.description`}
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-lg font-bold">Description</FormLabel>
                                        <FormControl>
                                            <div className="bg-gray-200 p-2 border-2 border-black">
                                                <Input
                                                    {...field}
                                                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                                                    placeholder="Enter song description"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`songs.${index}.audio`}
                                    render={({ field: { onChange, value } }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-lg font-bold">Audio File</FormLabel>
                                            <FormControl>
                                                <div className="bg-gray-200 p-2 border-2 border-black">
                                                    <label className="flex items-center cursor-pointer">
                                                        <span className="px-3 py-2 bg-red-600 text-white rounded mr-2">
                                                            Choose file
                                                        </span>
                                                        <span className="truncate text-sm">
                                                            {value?.name ?? "No file selected"}
                                                        </span>
                                                        <Input
                                                            type="file"
                                                            accept="audio/*"
                                                            onChange={(e) => onChange(e.target.files?.[0])}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-600" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`songs.${index}.image`}
                                    render={({ field: { onChange, value, ...rest } }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-lg font-bold">Cover Image</FormLabel>
                                            <div className="flex gap-4">
                                                <FormControl className="flex-1">
                                                    <div className="bg-gray-200 p-2 border-2 border-black">
                                                        <label className="flex items-center cursor-pointer">
                                                            <span className="px-3 py-2 bg-red-600 text-white rounded mr-2">
                                                                Choose file
                                                            </span>
                                                            <span className="truncate text-sm">
                                                                {value?.name ?? "No file selected"}
                                                            </span>
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    onChange(file);
                                                                    handleImageChange(index, file);
                                                                }}
                                                                className="hidden"
                                                                {...rest}
                                                            />
                                                        </label>
                                                    </div>
                                                </FormControl>
                                                <div className="w-16 h-16 flex-shrink-0 border-2 border-black flex items-center justify-center bg-gray-200">
                                                    {previewUrls[index] ? (
                                                        <img
                                                            src={previewUrls[index] || "/placeholder.svg"}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400 text-2xl">♪</span>
                                                    )}
                                                </div>
                                            </div>
                                            <FormMessage className="text-red-600" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => remove(index)}
                                className="bg-red-600 hover:bg-red-700 text-white border-2 border-black"
                            >
                                Remove Song
                            </Button>
                        </div>
                    ))}

                    <div className="flex gap-4">
                        <Button
                            type="button"
                            onClick={() => append({ title: "", description: "" })}
                            className="flex-1 bg-gray-200 text-black hover:bg-gray-300 border-2 border-black"
                        >
                            Add Song
                        </Button>

                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-2 border-black"
                        >
                            {mutation.isPending ? (
                                <span className="flex items-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Uploading...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <Upload className="mr-2" />
                                    Upload All
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
