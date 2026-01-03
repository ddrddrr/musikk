import { MusicFeed } from "@/features/layout/MusicFeed.tsx";
import { SongCollectionContainer } from "@/features/song-collections/components/SongCollectionContainer.tsx";
import { Connections } from "@/features/user/components/Connections.tsx";
import { ProfilePage } from "@/features/user/components/ProfilePage.tsx";
import { UserFeed } from "@/features/user/components/UserFeed.tsx";
import { Route, Routes, useParams } from "react-router-dom";

export function CenterColumn() {
    return (
        <div className="flex flex-col w-3/5">
            <div className="flex-1 overflow-y-auto p-4 ">
                <Routes>
                    <Route path="/" element={<MusicFeed />} />
                    <Route path="/feed" element={<UserFeed />} />
                    <Route path="collection/:uuid/*" element={<SongCollectionContainerWrapper />} />
                    <Route path="users/:uuid" element={<ProfilePage />} />
                    <Route path="users/:uuid/connections" element={<Connections />} />
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
