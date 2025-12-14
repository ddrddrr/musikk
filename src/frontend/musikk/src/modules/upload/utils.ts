import type { UUID } from "@/api/types";

export type UploadOk = { i: number; fieldId: string; uuid: UUID };
export type UploadErr = { i: number; fieldId: string; error: unknown };

export function isUploadErr(x: unknown): x is UploadErr {
    return typeof x === "object" && x !== null && "i" in x && "fieldId" in x && "error" in x;
}
