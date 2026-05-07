// see https://jsmanifest.com/race-conditions-async-javascript (State Synchronization Techniques section)
// guards against races between async ops that have multiple steps
// and which should be aborted if a similar new op has been started
// example:
//   const token = guard.beginOp();
//   await doSmth();
//   if (guard.isOpStale(token)) return;
//   await doSmthElse();
//   // and from outside, e.g. on teardown:
//   guard.markRunningOpStale();

export const createStaleAsyncOpGuard = () => {
    let opID = 0;
    return {
        beginOp: () => ++opID,
        isOpStale: (currOpID: number) => currOpID !== opID,
        markRunningOpStale: () => {
            ++opID;
        },
    };
};

export type StaleAsyncOpGuard = ReturnType<typeof createStaleAsyncOpGuard>;
