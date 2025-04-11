export function sleep(ms: number) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        console.log("sleeping")
    }
}