import { CenterColumn } from "@/modules/layout/CenterColumn.tsx";
import { LeftColumn } from "@/modules/layout/LeftColumn.tsx";
import { RightColumn } from "@/modules/layout/RightColumn.tsx";
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
