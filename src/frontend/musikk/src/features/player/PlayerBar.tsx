import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { ChangeActiveDeviceDropdown } from "@/features/player/ChangeActiveDeviceDropdown.tsx";
import { PlayerPlayButton } from "@/features/player/PlayerPlayButton.tsx";
import { useQueueChangeAPI } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { Button } from "@/features/ui/button";
import { Slider } from "@/features/ui/slider";
import { ListMusic, SkipBack, SkipForward, Volume2 } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";

interface PlayerBarProps {
    audioRef: React.RefObject<HTMLAudioElement>;
    totalDuration: number;
    time: number;
    seeking: boolean;
    setSeeking: (s: boolean) => void;
    setIsQueueOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onSeekCommit?: (t: number) => void;
}
export function PlayerBar({
    audioRef,
    totalDuration,
    time,
    seeking,
    setSeeking,
    setIsQueueOpen,
    onSeekCommit,
}: PlayerBarProps) {
    const { playingCollectionSong, isThisDeviceActive } = useContext(PlaybackContext);
    const [volume, setVolume] = useState(100);
    const [seekTime, setSeekTime] = useState(0);
    const shiftHeadMutation = useQueueChangeAPI();

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // if the audio is playing, coming to and end and the person is seeking back
    // the audio will switch
    // this is expected as there is no proper way to prevent the audio from switching
    // and seek at the same time
    const handleSeek = (value: number[]) => {
        setSeeking(true);
        setSeekTime(value[0]);
    };

    const handleSeekCommit = (value: number[]) => {
        const t = value[0];

        setSeekTime(t);
        onSeekCommit?.(t);

        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = t;
        }

        setSeeking(false);
    };

    const playingSong = playingCollectionSong?.song;
    const displayTime = seeking ? seekTime : time;
    const authorNames = playingCollectionSong?.song.authors.map((a) => a.display_name).join(", ");

    return (
        <div className="border-t border-black bg-white px-4 py-2">
            <div className="flex w-full items-center justify-between gap-4">
                {playingSong && (
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="h-14 w-14 flex-shrink-0 border-2 border-black">
                            {playingSong.image ? (
                                <img
                                    src={playingSong.image}
                                    alt={playingSong.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-200">
                                    <span className="text-2xl text-gray-400">♪</span>
                                </div>
                            )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                            <p className="truncate text-sm font-bold">{playingSong.title}</p>
                            <p className="truncate text-xs text-gray-600">{authorNames}</p>
                        </div>
                    </div>
                )}

                <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
                    {isThisDeviceActive && playingCollectionSong && (
                        <div className="flex max-w-[350px] min-w-0 basis-1/2 items-center gap-1">
                            <span className="text-right text-xs">{formatTime(displayTime)}</span>
                            <Slider
                                value={[displayTime]}
                                min={0}
                                max={totalDuration || 100}
                                step={1}
                                onValueChange={handleSeek}
                                onValueCommit={handleSeekCommit}
                                className="flex-1 cursor-pointer"
                            />
                            <span className="text-xs">{formatTime(totalDuration)}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        <Button
                            onClick={() => shiftHeadMutation.mutate({ action: "shift-back" })}
                            variant="ghost"
                            size="icon"
                        >
                            <SkipBack className="size-5" strokeWidth="2" />
                        </Button>
                        <PlayerPlayButton />
                        <Button
                            onClick={() => shiftHeadMutation.mutate({ action: "shift" })}
                            variant="ghost"
                            size="icon"
                        >
                            <SkipForward className="size-5" strokeWidth="2" />
                        </Button>
                    </div>

                    {isThisDeviceActive && (
                        <div className="flex items-center gap-2">
                            <Volume2 size={16} />
                            <Slider
                                value={[volume]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={(value) => setVolume(value[0])}
                                className="w-30 cursor-pointer"
                            />
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsQueueOpen((prev: boolean) => !prev)}
                    >
                        <ListMusic />
                    </Button>

                    <ChangeActiveDeviceDropdown />
                </div>
            </div>
        </div>
    );
}
