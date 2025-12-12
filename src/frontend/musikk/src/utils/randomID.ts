export function randomID(bytes = 16) {
    return Math.random().toString(bytes).slice(2);
}
