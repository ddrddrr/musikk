import { Layout } from "@/components/layout/Layout.tsx";
import { MainContent } from "@/components/layout/MainContent.tsx";
import { memo } from "react";

export const HomePage = memo(function HomePage() {
    return (
        <Layout>
            <MainContent />
        </Layout>
    );
});
