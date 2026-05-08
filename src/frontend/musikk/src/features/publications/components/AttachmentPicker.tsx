import { AttachmentObj } from "@/features/publications/types.ts";
import { SearchBar } from "@/features/search/SearchBar.tsx";

interface AttachmentPickerProps {
    attachedObj: AttachmentObj | undefined;
    onAttach: (obj: AttachmentObj) => void;
}

export function AttachmentPicker({ attachedObj, onAttach }: AttachmentPickerProps) {
    return (
        <div className="flex flex-col gap-2">
            <SearchBar onItemSelect={onAttach} placeholder="Attach" songMode="card" />

            {attachedObj && (
                <div className="text-xs text-muted-foreground italic">
                    Attached: {attachedObj.repr}
                </div>
            )}
        </div>
    );
}
