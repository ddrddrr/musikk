import { MainContent } from "@/components/layout/MainContent.tsx";
import { Layout } from "@/components/layout/Layout.tsx";
import { PlaybackProvider } from "@/providers/PlaybackProvider.tsx";

export function HomePage() {
    return (
        <Layout>
            <PlaybackProvider>
                <MainContent />
            </PlaybackProvider>
        </Layout>
    );
}
