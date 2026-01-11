import { AttachmentObj } from "@/features/publications/types";
import { SearchWindow } from "@/features/search/SearchWindow";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/ui/popover";
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

interface SearchBarProps {
    onItemSelect?: (obj: AttachmentObj) => void;
    placeholder?: string;
    songMode?: "container" | "card";
}

export function SearchBar({
    onItemSelect,
    placeholder = "Lookin' for something?",
    songMode = "container",
}: SearchBarProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (item: AttachmentObj) => {
        if (!onItemSelect) return;
        onItemSelect(item);
        setOpen(false);
    };

    return (
        <div className="relative max-w-sm">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant={"outline"}>
                        <Search className="mr-2 h-4 w-4" />
                        {placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="max-h-[500px] w-[350px] overflow-y-auto rounded-sm border bg-white p-0 shadow-lg"
                    align="center"
                >
                    <div className="p-4">
                        <SearchWindow
                            onItemSelect={onItemSelect ? handleSelect : undefined}
                            songMode={songMode}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
