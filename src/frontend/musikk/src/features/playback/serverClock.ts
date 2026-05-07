// a global, but fine in this case, at least for now
let clockOffsetMs = 0;

export function getServerClockEstimateMs(): number {
    return Date.now() + clockOffsetMs;
}

// TODO: we do not account for the network roundtrip time, should be added to estimate later
export function setGlobalServerClockOffset(serverTsMs: number): void {
    clockOffsetMs = serverTsMs - Date.now();
}
