import { calculatePlaybackStatePosMs } from "@/features/playback/playbackPosition.ts";
import { LocalPlaybackState } from "@/features/playback/types.ts";
import { useEffect, useReducer } from "react";

const RENDER_INTERVAL_MS = 250;

export function useCalculateSongPosMs(state: LocalPlaybackState | null): number {
    // kinda wonky but see
    // https://stackoverflow.com/questions/46240647/how-to-force-to-re-render-a-functional-component/53837442#53837442
    const [, forceRender] = useReducer((n: number) => n + 1, 0);

    // schedule a rerender every 250ms, i.e., return a current audio time val every 250ms
    useEffect(() => {
        // not playing -> no point in rerendering, values stays the same -> return
        if (!state?.isPlaying) return;
        const id = window.setInterval(forceRender, RENDER_INTERVAL_MS);
        return () => window.clearInterval(id);
    }, [state?.isPlaying]);

    if (!state) return 0;
    return calculatePlaybackStatePosMs(state);
}
