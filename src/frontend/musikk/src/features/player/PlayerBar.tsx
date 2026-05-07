import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { useCalculateSongPosMs } from "@/features/playback/hooks/useCalculateSongPosMs.ts";
import {
    PlaybackContext,
    PlayerControllerContext,
} from "@/features/playback/providers/playbackContext.ts";
import { ChangeActiveDeviceDropdown } from "@/features/player/ChangeActiveDeviceDropdown.tsx";
import { useVolume } from "@/features/player/hooks/useVolume.ts";
import { PlayerPlayButton } from "@/features/player/PlayerPlayButton.tsx";
import { useQueueNext, useQueuePrev } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useNavigateToSongAlbum } from "@/features/songs/hooks/useNavigateToSongAlbum.ts";
import { Button } from "@/features/ui/button";
import { Slider } from "@/features/ui/slider";
import { AuthorLinks } from "@/features/user/components/AuthorLinks.tsx";
import { formatDuration } from "@/utils/formatDuration.ts";
import { ListMusic, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import React, { useCallback, useContext, useState } from "react";

interface PlayerBarProps {
    setIsQueueOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isMutedFallback: boolean;
    onUnmute: () => Promise<void>;
    setUserVolume: (value: number) => void;
}
export function PlayerBar({
    setIsQueueOpen,
    isMutedFallback,
    onUnmute,
    setUserVolume,
}: PlayerBarProps) {
    const { playbackState, totalDuration } = useContext(PlaybackContext);
    const controller = useContext(PlayerControllerContext);
    const playingCollectionSong = playbackState?.collectionSong;
    const { volume, setVolume, handleVolumeCommit, handleMuteToggle } = useVolume({
        setUserVolume,
    });
    const [seekDraftMs, setSeekDraftMs] = useState<number | null>(null);
    const nextMutation = useQueueNext();
    const prevMutation = useQueuePrev();
    const navigateToAlbum = useNavigateToSongAlbum();

    const calculateSongPosMs = useCalculateSongPosMs(playbackState);
    const displayMs = seekDraftMs ?? calculateSongPosMs;

    const handleSeek = useCallback((value: number[]) => setSeekDraftMs(value[0] * 1000), []);

    const handleSeekCommit = useCallback(
        (value: number[]) => {
            controller.applyUserSeek(value[0] * 1000);
            setSeekDraftMs(null);
        },
        [controller],
    );

    const playingSong = playingCollectionSong?.song;

    return (
        <div className="flex h-20 items-center border-t border-foreground bg-card px-4 py-2">
            <div className="flex w-full items-center justify-between gap-4">
                {playingSong && (
                    <div className="flex min-w-0 items-center gap-3">
                        <MediaThumbnail
                            src={playingSong.image}
                            alt={playingSong.title}
                            className="size-14 shrink-0 border-2 border-foreground"
                        />
                        <div className="flex min-w-0 flex-col">
                            <button
                                type="button"
                                onClick={() => void navigateToAlbum(playingCollectionSong.uuid)}
                                className="cursor-pointer truncate bg-transparent p-0 text-left text-sm font-bold hover:underline"
                            >
                                {playingSong.title}
                            </button>
                            <AuthorLinks
                                authors={playingCollectionSong.song.authors}
                                className="text-xs text-muted-foreground"
                            />
                        </div>
                    </div>
                )}

                <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
                    {playingCollectionSong && (
                        <div className="flex max-w-[350px] min-w-0 basis-1/2 items-center gap-1">
                            <span className="text-right text-xs">{formatDuration(displayMs)}</span>
                            <Slider
                                value={[displayMs / 1000]}
                                min={0}
                                max={totalDuration || 100}
                                step={1}
                                onValueChange={handleSeek}
                                onValueCommit={handleSeekCommit}
                                className="flex-1 cursor-pointer"
                            />
                            <span className="text-xs">{formatDuration(totalDuration * 1000)}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        <Button onClick={() => prevMutation.mutate()} variant="ghost" size="icon">
                            <SkipBack className="size-5" strokeWidth="2" />
                        </Button>
                        <PlayerPlayButton />
                        <Button onClick={() => nextMutation.mutate()} variant="ghost" size="icon">
                            <SkipForward className="size-5" strokeWidth="2" />
                        </Button>
                        {isMutedFallback && (
                            // shown when audio is forced muted because no user gesture was
                            // available when playback started
                            // the unmute click is the fallback builds the AudioContext
                            <Button
                                onClick={() => void onUnmute()}
                                variant="ghost"
                                size="icon"
                                title="Tap to unmute on this device"
                                className="bg-highlight"
                            >
                                <VolumeX className="size-5" strokeWidth="2" />
                            </Button>
                        )}
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
