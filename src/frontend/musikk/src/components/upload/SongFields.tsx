import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { AudioField } from "./AudioField";
import { ImageField } from "../common/ImageField.tsx";

export function SongFields({
    index,
    onRemove,
    isSuccess,
    errorMsg,
    hideRemove,
}: {
    index: number;
    onRemove: () => void;
    isSuccess: boolean;
    errorMsg?: string;
    hideRemove?: boolean;
}) {
    const { control } = useFormContext();
    const borderClass = isSuccess ? "border-green-600" : errorMsg ? "border-red-600" : "border-gray-300";

    return (
        <div className={`bg-white p-6 rounded-sm border-2 ${borderClass} space-y-4`}>
            <FormField
                control={control}
                name={`songs.${index}.title`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name={`songs.${index}.description`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <AudioField index={index} />
                <ImageField name={`songs.${index}.image`} />
            </div>

            {errorMsg && <div className="text-red-600">{errorMsg}</div>}

            {!hideRemove && (
                <Button
                    variant="destructive"
                    onClick={onRemove}
                    className="bg-red-600 hover:bg-red-700 border-black border-2"
                >
                    Remove
                </Button>
            )}
        </div>
    );
}
