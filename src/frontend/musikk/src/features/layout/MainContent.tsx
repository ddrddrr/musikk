import { CenterColumn } from "@/features/layout/CenterColumn.tsx";
import { LeftColumn } from "@/features/layout/LeftColumn.tsx";
import { RightColumn } from "@/features/layout/RightColumn.tsx";
import { memo } from "react";

export const MainContent = memo(function MainContent() {
    return (
        <div className="flex w-full">
            <LeftColumn />
            <CenterColumn />
            <RightColumn />
        </div>
    );
});
