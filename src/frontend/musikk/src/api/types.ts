import { components } from "@/api/openapi.gen.ts";

export type UUID = string;

export type ApiSchemas = components["schemas"];

export interface PaginatedRes<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
