import { AttachmentObj } from "@/features/publications/types.ts";
import { SearchBar } from "@/features/search/SearchBar.tsx";

interface AttachmentPickerProps {
    attachedObj: AttachmentObj | undefined;
    onAttach: (obj: AttachmentObj) => void;
}

export function AttachmentPicker({ attachedObj, onAttach }: AttachmentPickerProps) {
    return (
        <div className="space-y-2">
            <SearchBar onItemSelect={onAttach} placeholder="Attach" songMode="card" />

            {attachedObj && (
                <div className="text-xs italic text-muted-foreground">
                    Attached: {attachedObj.repr}
                </div>
            )}
        </div>
    );
}