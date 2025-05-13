import { IAttachment } from "@/components/publications/types";
import { SearchWindow } from "@/components/search/SearchWindow";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
    onItemSelect?: (obj: IAttachment) => void;
    placeholder?: string;
    songMode?: "container" | "card";
}

export function SearchBar({
    onItemSelect,
    placeholder = "Lookin' for something?",
    songMode = "container",
}: SearchBarProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (item: IAttachment) => {
        if (!onItemSelect) return;
        onItemSelect(item);
        setOpen(false);
    };

    return (
        <div className="relative max-w-sm mx-4">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className="flex items-center w-full bg-white hover:bg-white/90 transition-colors rounded-full px-4 py-2 text-left text-sm text-black">
                        <Search className="w-4 h-4 mr-2" />
                        <span className="opacity-70">{placeholder}</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[350px] max-h-[500px] overflow-y-auto p-0 bg-white border rounded-lg shadow-lg"
                    align="center"
                >
                    <div className="p-4">
                        <SearchWindow onItemSelect={onItemSelect ? handleSelect : undefined} songMode={songMode} />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
