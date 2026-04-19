import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { ChangeActiveDeviceDropdown } from "@/features/player/ChangeActiveDeviceDropdown.tsx";
import { useVolume } from "@/features/player/hooks/useVolume.ts";
import { PlayerPlayButton } from "@/features/player/PlayerPlayButton.tsx";
import { useQueueNext, useQueuePrev } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { Button } from "@/features/ui/button";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { Slider } from "@/features/ui/slider";
import { ListMusic, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import React, { useCallback, useContext, useState } from "react";

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

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
    const { volume, setVolume, handleVolumeCommit, handleMuteToggle } = useVolume(audioRef);
    const [seekTime, setSeekTime] = useState(0);
    const nextMutation = useQueueNext();
    const prevMutation = useQueuePrev();

    // if the audio is playing, coming to and end and the person is seeking back
    // the audio will switch
    // this is expected as there is no proper way to prevent the audio from switching
    // and seek at the same time
    const handleSeek = useCallback((value: number[]) => {
        setSeeking(true);
        setSeekTime(value[0]);
    }, [setSeeking]);

    const handleSeekCommit = useCallback((value: number[]) => {
        const t = value[0];

        setSeekTime(t);
        onSeekCommit?.(t);

        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = t;
        }

        setSeeking(false);
    }, [onSeekCommit, audioRef, setSeeking]);

    const playingSong = playingCollectionSong?.song;
    const displayTime = seeking ? seekTime : time;

    return (
        <div className="border-t border-foreground bg-card px-4 py-2">
            <div className="flex w-full items-center justify-between gap-4">
                {playingSong && (
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="size-14 shrink-0 border-2 border-foreground">
                            {playingSong.image ? (
                                <img
                                    src={playingSong.image}
                                    alt={playingSong.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-muted">
                                    <span className="text-2xl text-muted-foreground">♪</span>
                                </div>
                            )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                            <p className="truncate text-sm font-bold">{playingSong.title}</p>
                            <AuthorLinks authors={playingCollectionSong.song.authors} className="text-xs text-muted-foreground" />
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
                            onClick={() => prevMutation.mutate()}
                            variant="ghost"
                            size="icon"
                        >
                            <SkipBack className="size-5" strokeWidth="2" />
                        </Button>
                        <PlayerPlayButton />
                        <Button
                            onClick={() => nextMutation.mutate()}
                            variant="ghost"
                            size="icon"
                        >
                            <SkipForward className="size-5" strokeWidth="2" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleMuteToggle}
                            className="shrink-0"
                        >
                            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </Button>
                        <Slider
                            value={[volume]}
                            min={0}
                            max={100}
                            step={1}
                            // slider always passes an array (one entry per slider dot, we have 1)
                            onValueChange={(value) => setVolume(value[0])}
                            onValueCommit={handleVolumeCommit}
                            className="w-30 cursor-pointer"
                        />
                    </div>

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
