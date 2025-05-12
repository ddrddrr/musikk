import { CenterColumn } from "@/components/layout/CenterColumn.tsx";
import { LeftColumn } from "@/components/layout/LeftColumn.tsx";
import { RightColumn } from "@/components/layout/RightColumn.tsx";
import { memo } from "react";

export const MainContent = memo(function MainContent() {
    return (
        <div className="flex w-full h-full">
            <LeftColumn />
            <CenterColumn />
            <RightColumn />
        </div>
    );
});
