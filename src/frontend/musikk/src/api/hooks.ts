import { PaginatedRes } from "@/api/types.ts";

export function getOffsetFromNextUrl(lastPage: PaginatedRes<unknown>): number | undefined {
    if (!lastPage.next) return undefined;
    const offsetStr = new URL(lastPage.next).searchParams.get("offset");
    return offsetStr ? Number(offsetStr) : undefined;
}
