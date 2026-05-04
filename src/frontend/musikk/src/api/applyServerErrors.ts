import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

import { NON_FIELD_KEY, getErrorCode, getErrorDetail, getServerErrors } from "@/api/errorUtils.ts";

interface ApplyServerErrorsOptions<T extends FieldValues> {
    fieldMap?: Partial<Record<string, FieldPath<T>>>;
    focusFirst?: boolean;
}

export function applyServerErrors<T extends FieldValues>(
    form: UseFormReturn<T>,
    error: unknown,
    options: ApplyServerErrorsOptions<T> = {},
): void {
    const { fieldMap, focusFirst = true } = options;
    const code = getErrorCode(error) ?? "server";
    const errors = getServerErrors(error);

    const rootMessages: string[] = [];
    const fieldsToSet: { target: FieldPath<T>; message: string }[] = [];

    if (errors) {
        const registered = new Set(
            Object.keys(form.getValues() as Record<string, unknown>) as FieldPath<T>[],
        );

        for (const [key, messages] of Object.entries(errors)) {
            if (messages.length === 0) continue;
            if (key === NON_FIELD_KEY) {
                rootMessages.push(...messages);
                continue;
            }
            const target = (fieldMap?.[key] ?? (key as FieldPath<T>)) as FieldPath<T>;
            if (!registered.has(target)) {
                rootMessages.push(messages[0]);
                continue;
            }
            fieldsToSet.push({ target, message: messages[0] });
        }
    }

    if (rootMessages.length === 0 && fieldsToSet.length === 0) {
        rootMessages.push(getErrorDetail(error));
    }

    fieldsToSet.forEach(({ target, message }, i) => {
        form.setError(target, { type: code, message }, { shouldFocus: focusFirst && i === 0 });
    });

    if (rootMessages.length > 0) {
        form.setError("root.serverError", { type: code, message: rootMessages.join(" ") });
    }
}
