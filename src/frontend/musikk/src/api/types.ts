export type UUID = string;
export type URL = string;

export interface PaginatedRes<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
