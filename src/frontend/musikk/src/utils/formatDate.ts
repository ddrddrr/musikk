export function formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
    });
}
