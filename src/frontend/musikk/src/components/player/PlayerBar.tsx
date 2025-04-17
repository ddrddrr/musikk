import { PlayerPlayButton } from "@/components/player/PlayerPlayButton.tsx";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useQueueChangeAPI } from "@/hooks/useQueueAPI.ts";
import { PlayingSongContext } from "@/providers/playingSongContext.ts";
import { SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";

interface PlayerBarProps {
    duration: number;
    time: number;
}

export function PlayerBar({ duration, time }: PlayerBarProps) {
    const { playingSong } = useContext(PlayingSongContext);
    const useShiftHeadMutation = useQueueChangeAPI();
    const [volume, setVolume] = useState(100);
    const [seeking, setSeeking] = useState(false);
    const [seekTime, setSeekTime] = useState(0);
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
        setSeekTime(value[0]);
        setSeeking(true);
    };

    const handleSeekCommit = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = seekTime;
        }
        setSeeking(false);
    };

    const displayTime = seeking ? seekTime : time;
    return (
        <div className="bg-white p-4 rounded-none border-t border-black">
            {playingSong ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 flex-shrink-0 border-2 border-black">
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

                        <div className="flex-1">
                            <div className="bg-gray-200 p-2 border-2 border-black mb-2">
                                <p className="font-bold truncate">{playingSong.title}</p>
                            </div>
                            <div className="bg-gray-200 p-2 border-2 border-black">
                                <p className="text-sm truncate">{playingSong.artist}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm w-10 text-right">{formatTime(displayTime)}</span>
                        <Slider
                            value={[displayTime]}
                            min={0}
                            max={duration || 100}
                            step={1}
                            onValueChange={handleSeek}
                            onValueCommit={handleSeekCommit}
                            className="flex-1 cursor-pointer"
                        />
                        <span className="text-sm w-10">{formatTime(duration)}</span>
                    </div>

                    <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Volume2 size={18} />
                            <Slider
                                value={[volume]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={(value) => setVolume(value[0])}
                                className="w-24 cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="text-gray-700 hover:text-black">
                                <SkipBack size={24} />
                            </Button>

                            <PlayerPlayButton />

                            <Button
                                onClick={() => useShiftHeadMutation.mutate({ action: "shift" })}
                                variant="ghost"
                                size="icon"
                                className="text-gray-700 hover:text-black"
                            >
                                <SkipForward size={24} />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-gray-500">Select a song to play</p>
                </div>
            )}
        </div>
    );
}
