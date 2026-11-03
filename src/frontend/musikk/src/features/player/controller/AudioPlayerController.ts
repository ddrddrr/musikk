import { setGlobalServerClockOffset } from "@/features/playback/serverClock.ts";
import { LocalPlaybackState } from "@/features/playback/types.ts";
import {
    ActiveDeviceReportPayload,
    PlaybackSetPayload,
    PlaybackSnapshotPayload,
    updatedLocalPlaybackWithServerSnapshot,
} from "@/features/playback/ws/playbackPayload.ts";
import { ActivePlayback } from "@/features/player/controller/ActivePlayback.ts";
import {
    AudioOutputHandlers,
    LocalAudioOutput,
} from "@/features/player/controller/LocalAudioOutput.ts";
import { PlaybackHost, PlaybackMode } from "@/features/player/controller/PlaybackMode.ts";
import { RemotePlayback } from "@/features/player/controller/RemotePlayback.ts";

export type PlaybackHandlers = {
    sendActiveDeviceReport: (payload: ActiveDeviceReportPayload) => void;
    sendSet: (payload: PlaybackSetPayload) => void;
    onSongEnd: () => void;
};

// this used to be handled with hooks (e.g. usePlayer)
// but the WS handlers kept reading stale values
// and a ton of hacks were added in order for server <-> client sync to work properly
// this got really messy, so the logic was centralized into a class
// so that all of the audio-related ops live in the same place
// and always read the fresh values

// the playback state and the mode aren't a copy of react state
// the controller owns both directly and react reads them later through
// useSyncExternalStore.
// The controller learns the mode from the active device id in each snapshot

// forwards each call to the mode of this tab: ActivePlayback when this tab plays the audio,
// RemotePlayback otherwise
export class AudioPlayerController {
    private readonly thisDeviceId: string;
    private readonly output = new LocalAudioOutput();

    private serverState: LocalPlaybackState | null = null;
    // what react reads: the view of the current mode.
    // It is stored, so useSyncExternalStore gets the same object while nothing changed
    private viewState: LocalPlaybackState | null = null;

    // pub-sub here is not the same as the ws client, since useSyncExternalStore
    // wants listeners with no args and reads the state itself,
    // so notify() just tells every listener "something changed"
    // instead of sending a payload (event) to listeners like WSClient does
    private listeners = new Set<() => void>();
    // we do the ! assertions on it because the controller is created before
    // the handlers and we can't realistically pass them in the constructor
    private playbackHandlers: PlaybackHandlers | null = null;

    private readonly host: PlaybackHost = {
        getServerState: () => this.serverState,
        refreshView: () => this.refreshView(),
        sendSet: (payload) => this.playbackHandlers!.sendSet(payload),
        sendActiveDeviceReport: (payload) => this.playbackHandlers!.sendActiveDeviceReport(payload),
    };
    private readonly activeMode = new ActivePlayback(this.host, this.output);
    private readonly remoteMode = new RemotePlayback(this.host, this.output);
    private mode: PlaybackMode = this.remoteMode;

    constructor(thisDeviceId: string) {
        this.thisDeviceId = thisDeviceId;
    }

    setHandlers(handlers: PlaybackHandlers): void {
        this.playbackHandlers = handlers;
    }

    init(audio: HTMLAudioElement, audioHandlers: AudioOutputHandlers): void {
        this.output.setUpPlayerForAudioElement(audio, audioHandlers);
        // catch up to whatever WS events arrived before the audio element was mounted
        this.mode.enter();
        this.refreshView();
    }

    destroy(): void {
        this.mode.exit();
        this.output.tearDownPlayer();
    }

    getPlaybackState(): LocalPlaybackState | null {
        return this.viewState;
    }

    getIsThisDeviceActive(): boolean {
        return this.mode === this.activeMode;
    }

    // useSyncExternalStore calls this
    // the listener is react's "schedule a re-render" callback
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    // tells every listener (i.e. only react for us) that the state changed,
    // react will then call getPlaybackState() to read the new value (re-render)
    private notify(): void {
        this.listeners.forEach((cb) => cb());
    }

    applyServerSnapshot(payload: PlaybackSnapshotPayload): void {
        if (payload.server_ts_ms !== undefined) setGlobalServerClockOffset(payload.server_ts_ms);
        this.serverState = updatedLocalPlaybackWithServerSnapshot(this.serverState, payload);

        const isActive = payload.active_device_id === this.thisDeviceId;
        if (isActive !== this.getIsThisDeviceActive()) {
            this.setIsThisDeviceActive(isActive);
            return;
        }
        this.mode.onSnapshot(this.serverState);
    }

    applyCommand(command: PlaybackSetPayload): void {
        this.mode.applyCommand(command);
    }

    setIsPlaying(isPlaying: boolean): void {
        this.mode.setIsPlaying(isPlaying);
    }

    playAfterSongChange(): void {
        this.mode.playAfterSongChange();
    }

    applyUserSeek(positionMs: number): void {
        this.mode.seek(positionMs);
    }

    // the mode changes only together with a snapshot, which is already in serverState,
    // so the new mode starts from it
    private setIsThisDeviceActive(active: boolean): void {
        this.mode.exit();
        this.mode = active ? this.activeMode : this.remoteMode;
        this.mode.enter();
        // react also reads the mode from here, so it has to hear about it
        // even when the view state is the same object
        this.viewState = this.mode.view();
        this.notify();
    }

    handleAudioStateChange(): void {
        this.mode.onAudioStateChange();
    }

    handleEnded(): void {
        this.output.markEnded();
        this.playbackHandlers!.onSongEnd();
    }

    setUserVolume(value: number): void {
        this.output.setUserVolume(value);
    }

    unmute(ensureAudioPipeline: () => void): Promise<void> {
        return this.output.unmute(ensureAudioPipeline);
    }

    private refreshView(): void {
        const next = this.mode.view();
        if (next === this.viewState) return;
        this.viewState = next;
        this.notify();
    }
}
