import { PlayerPlayButton } from "@/components/player/PlayerPlayButton.tsx";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useQueueChangeAPI } from "@/hooks/useQueueAPI.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";

interface PlayerBarProps {
    duration: number;
    time: number;
    seeking: boolean;
    setSeeking: (s: boolean) => void;
}

export function PlayerBar({ duration, time }: PlayerBarProps) {
    const { playingCollectionSong } = useContext(PlaybackContext);
    const [volume, setVolume] = useState(100);
    const [seeking, setSeeking] = useState(false);
    const [seekTime, setSeekTime] = useState(0);
    const useShiftHeadMutation = useQueueChangeAPI();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = document.querySelector("audio");
        if (audio) {
            audioRef.current = audio;
        }
    }, []);

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

    const handleSeek = (value: number[]) => {
        setSeeking(true);
        setSeekTime(value[0]);
    };

    const handleSeekCommit = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = seekTime;
        }
        // helps with little stutter on seek
        setTimeout(() => {
            setSeeking(false);
        }, 100);
    };

    const playingSong = playingCollectionSong?.song;
    const displayTime = seeking ? seekTime : time;
    const authorNames = playingCollectionSong?.song.authors.map((a) => a.display_name).join(", ");

    return (
        <div className="bg-white border-t border-black px-4 py-2">
            {playingSong ? (
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 border-2 border-black flex-shrink-0">
                            {playingSong.image ? (
                                <img
                                    src={playingSong.image}
                                    alt={playingSong.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-2xl">♪</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <p className="font-bold truncate text-sm">{playingSong.title}</p>
                            <p className="text-xs text-gray-600 truncate">{authorNames}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-end min-w-0">
                        <div className="flex items-center gap-1 basis-1/2 min-w-0 max-w-[350px]">
                            <span className="text-xs text-right">{formatTime(displayTime)}</span>
                            <Slider
                                value={[displayTime]}
                                min={0}
                                max={duration || 100}
                                step={1}
                                onValueChange={handleSeek}
                                onValueCommit={handleSeekCommit}
                                className="flex-1 cursor-pointer"
                            />
                            <span className="text-xs">{formatTime(duration)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => useShiftHeadMutation.mutate({ action: "shift-back" })}
                                variant="ghost"
                                size="icon"
                            >
                                <SkipBack size={20} />
                            </Button>
                            <PlayerPlayButton />
                            <Button
                                onClick={() => useShiftHeadMutation.mutate({ action: "shift" })}
                                variant="ghost"
                                size="icon"
                            >
                                <SkipForward size={20} />
                            </Button>
                        </div>

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

                        <Button variant="ghost" size="icon">
                            <span className="text-sm">≡</span>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-2">
                    <p className="text-gray-500 text-xs">Select something to play</p>
                </div>
            )}
        </div>
    );
}
