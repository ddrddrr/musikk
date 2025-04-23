import { PlayerBox } from "@/components/player/PlayerBox";
import { SongCollectionContainer } from "@/components/song-collection/SongCollectionContainer";
import { Route, Routes, useParams } from "react-router-dom";

export function CenterColumn() {
    return (
        <div className="flex flex-col w-3/5 border-l border-r border-red-700">
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                <Routes>
                    <Route
                        path="/"
                        element={
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center p-20 text-white bg-red-500 max-w-md border-2 border-black">
                                    <p className="text-2xl">Welcome ⊂(^‿^)つ</p>
                                </div>
                            </div>
                        }
                    />
                    <Route path="collection/:uuid/*" element={<SongCollectionContainerWrapper />} />
                </Routes>
            </div>
            <PlayerBox />
        </div>
    );
}

function SongCollectionContainerWrapper() {
    const { uuid } = useParams();

    if (!uuid) return null;

    return <SongCollectionContainer collectionUUID={uuid} />;
}
