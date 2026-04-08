export function formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
    });
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString(undefined, {
        dateStyle: "medium",
    });
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
    const da = new Date(a);
    const db = new Date(b);
    return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
    );
}
