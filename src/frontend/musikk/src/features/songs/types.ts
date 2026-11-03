import { ApiSchemas } from "@/api/types.ts";

export type Song = ApiSchemas["BaseSongRetrieve"] & { kind?: "song" };
