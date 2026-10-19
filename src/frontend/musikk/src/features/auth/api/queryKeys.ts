export const authKeys = {
    base: ["auth"] as const,
    emailVerification: (confirmationKey: string) =>
        [...authKeys.base, "email-verification", confirmationKey] as const,
};
