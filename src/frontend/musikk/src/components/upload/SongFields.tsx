import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import AudioField from "./AudioField";
import ImageField from "./ImageField";

export default function SongFields({
    index,
    control,
    onRemove,
    isSuccess,
}: {
    index: number;
    control: any;
    onRemove: () => void;
    isSuccess: boolean;
}) {
    return (
        <div
            className={`bg-white p-6 rounded-sm border-2 ${
                isSuccess ? "border-green-600" : "border-red-600"
            } space-y-4`}
        >
            <FormField
                control={control}
                name={`songs.${index}.title`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="Enter song title" />
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
                            <Input {...field} placeholder="Enter song description" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <AudioField index={index} control={control} />
                <ImageField index={index} control={control} />
            </div>

            <Button
                variant="destructive"
                onClick={onRemove}
                className="bg-red-600 hover:bg-red-700 border-2 border-black"
            >
                Remove Song
            </Button>
        </div>
    );
}
