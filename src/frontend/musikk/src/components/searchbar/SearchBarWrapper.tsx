import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search } from "lucide-react";
import { SearchBar } from "./SearchBar";

export function SearchBarWrapper() {
    return (
        <div className="relative max-w-sm mx-4">
            <Popover>
                <PopoverTrigger asChild>
                    <button className="flex items-center w-full bg-white hover:bg-white/90 transition-colors rounded-full px-4 py-2 text-left text-sm text-black">
                        <Search className="w-4 h-4 mr-2" />
                        <span className="opacity-70">Lookin' for something?</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[350px] max-h-[500px] overflow-y-auto p-0 bg-white border rounded-lg shadow-lg"
                    align="center"
                >
                    <div className="p-4">
                        <SearchBar />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
