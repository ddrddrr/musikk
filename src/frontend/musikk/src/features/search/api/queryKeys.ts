export const searchKeys = {
    base: ["search"] as const,
    result: (query: string) => [...searchKeys.base, query] as const,
};
