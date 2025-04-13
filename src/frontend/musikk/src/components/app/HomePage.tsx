import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { CenterColumn } from "@/components/layout/CenterColumn.tsx";
import { Layout } from "@/components/layout/Layout.tsx";
import { LeftColumn } from "@/components/layout/LeftColumn.tsx";
import { RightColumn } from "@/components/layout/RightColumn.tsx";
import { Player } from "@/components/player/Player.tsx";
import { fetchCollectionList } from "@/components/song-collection/queries.ts";
import type { ISongCollection } from "@/components/song-collection/types.ts";
import type { ISong } from "@/components/song/types.ts";

export function HomePage() {
    const [selectedSong, setSelectedSong] = useState<ISong | null>(null);
    const [selectedCollection, setSelectedCollection] = useState<ISongCollection | null>(null);
    const [currentDuration, setCurrentDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);

    const { isPending, error, data } = useQuery({
        queryKey: ["collectionList"],
        queryFn: fetchCollectionList,
    });

    if (isPending) return <div className="flex items-center justify-center h-screen bg-gray-200">Loading...</div>;
    if (error)
        return (
            <div className="flex items-center justify-center h-screen bg-gray-200">
                An error has occurred: {error.message}
            </div>
        );

    function handleSongClick(song: ISong) {
        if (selectedCollection?.image && !song.image) {
            song.image = selectedCollection.image;
        }

        setSelectedSong((prev) => (prev?.uuid === song.uuid ? null : song));
        setCurrentDuration(0);
        setCurrentTime(0);
    }

    function handleBackClick() {
        setSelectedCollection(null);
    }

    function handleDurationChange(duration: number) {
        setCurrentDuration(duration);
        if (selectedSong) {
            setSelectedSong({ ...selectedSong, duration });
        }
    }

    function handleTimeUpdate(time: number) {
        setCurrentTime(time);
    }

    return (
        <Layout>
            <LeftColumn collections={data} setSelectedCollection={setSelectedCollection} />
            <CenterColumn
                selectedCollection={selectedCollection}
                selectedSong={selectedSong}
                handleSongClick={handleSongClick}
                onBackClick={handleBackClick}
            />
            <RightColumn currentTime={currentTime} selectedSong={selectedSong} />
            <div className="hidden">
                <Player
                    url={selectedSong ? selectedSong.mpd : null}
                    onDurationChange={handleDurationChange}
                    onTimeUpdate={handleTimeUpdate}
                />
            </div>
        </Layout>
    );
}
