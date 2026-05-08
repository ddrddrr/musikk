import { AttachmentObj } from "@/features/publications/types";
import { SearchWindow } from "@/features/search/SearchWindow";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/ui/popover";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
    const location = useLocation();

    // we could do an onClick event instead, but this is better I think, since
    // cards own their navigation internally
    useEffect(() => {
        setOpen(false);
    }, [location]);

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
                        <Search className="mr-2 size-4" />
                        {placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="max-h-[500px] w-[350px] overflow-y-auto rounded-sm border bg-card p-0 shadow-lg"
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
