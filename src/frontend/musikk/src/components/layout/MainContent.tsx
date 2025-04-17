import { CenterColumn } from "@/components/layout/CenterColumn.tsx";
import { LeftColumn } from "@/components/layout/LeftColumn.tsx";
import { RightColumn } from "@/components/layout/RightColumn.tsx";
import { ISongCollection } from "@/components/song-collection/types.ts";
import { useCallback, useState } from "react";

export function MainContent() {
    const [selectedCollection, setSelectedCollection] = useState<ISongCollection | null>(null);
    const handleBackClick = useCallback(() => setSelectedCollection(null), []);

    return (
        <div className="flex w-full h-screen">
            <LeftColumn setSelectedCollection={setSelectedCollection} />
            <CenterColumn selectedCollection={selectedCollection} onBackClick={handleBackClick} />
            <RightColumn />
        </div>
    );
}
