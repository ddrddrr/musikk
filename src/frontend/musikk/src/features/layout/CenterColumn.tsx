import { MusicFeed } from "@/features/layout/MusicFeed.tsx";
import { ChatPreviewList } from "@/features/publications/components/chat/ChatPreviewList.tsx";
import { GlobalFeed } from "@/features/publications/components/posts/GlobalFeed.tsx";
import { SongCollectionContainer } from "@/features/song-collections/components/SongCollectionContainer.tsx";
import { Connections } from "@/features/user/components/Connections.tsx";
import { ProfilePage } from "@/features/user/components/ProfilePage.tsx";
import { Route, Routes, useParams } from "react-router-dom";

export function CenterColumn() {
    return (
        <div className="flex w-3/5 flex-col">
            <div className="flex-1 overflow-y-auto p-4">
                <Routes>
                    <Route path="/" element={<MusicFeed />} />
                    <Route path="/feed" element={<GlobalFeed />} />
                    <Route path="collection/:uuid/*" element={<SongCollectionContainerWrapper />} />
                    <Route path="users/:uuid" element={<ProfilePage />} />
                    <Route path="users/:uuid/connections" element={<Connections />} />
                    <Route path="users/:uuid/chats" element={<ChatPreviewList />} />
                    {/*TODO: retrieve chat with messages*/}
                    {/*<Route path="users/:uuid/chats/:uuid" element={<ChatBox />} />*/}
                </Routes>
            </div>
        </div>
    );
}

function SongCollectionContainerWrapper() {
    const { uuid } = useParams();
    if (!uuid) return null;
    return <SongCollectionContainer collectionUUID={uuid} />;
}
