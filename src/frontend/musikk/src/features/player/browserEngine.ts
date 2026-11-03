// maxTouchPoints distinguishes iPad (>=2) from desktop Mac (0)
// as it turned out the older "ontouchend in document" check is also true on desktop Safari and so
// detected Macs by a mistake
export const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && navigator.maxTouchPoints > 1);

// Safari on macOS, and every browser on iOS, since they all use WebKit there.
// Chrome-based browsers also have "AppleWebKit" in the user agent, so they are excluded
export const isWebKit =
    isIOS ||
    (navigator.userAgent.includes("AppleWebKit") && !navigator.userAgent.includes("Chrome"));
