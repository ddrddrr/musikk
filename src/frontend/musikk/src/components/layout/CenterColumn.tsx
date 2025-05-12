import { Feed } from "@/components/layout/Feed";
import { SongCollectionContainer } from "@/components/song-collections/SongCollectionContainer";
import { ProfilePage } from "@/components/user/ProfilePage";
import { Route, Routes, useParams } from "react-router-dom";

export function CenterColumn() {
    return (
        <div className="flex flex-col w-3/5 border-l border-r border-red-700">
            <div className="flex-1 overflow-y-auto p-4 ">
                <Routes>
                    <Route path="/" element={<Feed />} />
                    <Route path="collection/:uuid/*" element={<SongCollectionContainerWrapper />} />
                    <Route path="users/:uuid" element={<ProfilePage />} />
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
