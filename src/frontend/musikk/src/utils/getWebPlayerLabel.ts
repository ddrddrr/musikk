export function getWebPlayerLabel() {
    const ua = navigator.userAgent;

    let os = "Unknown OS";
    if (/Windows NT/.test(ua)) os = "Windows";
    else if (/Mac OS X/.test(ua) && !/like Mac OS X/.test(ua)) os = "macOS";
    else if (/Android/.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
    else if (/Linux/.test(ua)) os = "Linux";

    let browser = "Unknown Browser";
    if (/Edg\//.test(ua)) browser = "Edge";
    else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome";
    else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";
    else if (/Firefox\//.test(ua)) browser = "Firefox";

    return `Web Player (${os}, ${browser})`;
}
