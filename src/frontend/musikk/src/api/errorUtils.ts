import { isAxiosError } from "axios";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

export type ServerErrors = Record<string, string[]>;

export interface ServerErrorBody {
    detail?: string;
    code?: string;
    errors?: ServerErrors;
}

// DRF emits errors not tied to a specific input under "non_field_errors"
// we normalize them wiht this key so the form layer has one key to route to root.serverError
const FORM_LEVEL_ERROR_KEY = "non_field";

function getResponseData(error: unknown): unknown {
    if (isAxiosError(error)) {
        const data = error.response?.data;
        if (data && typeof data === "object") return data;
    }
    return undefined;
}

export function getErrorDetail(
    error: unknown,
    defaultMessage = "Something went wrong. Please try again.",
): string {
    const data = getResponseData(error);
    if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (typeof obj.detail === "string") return obj.detail;
        // not everything is unified yet...
        if (typeof obj.error === "string") return obj.error;
        if (typeof obj.message === "string") return obj.message;
        // e.g. dj-rest-auth returns some errs in that field
        const nonField = obj.non_field_errors;
        if (Array.isArray(nonField) && typeof nonField[0] === "string") return nonField[0];
        for (const value of Object.values(obj)) {
            if (Array.isArray(value) && typeof value[0] === "string") return value[0];
        }
    }
    if (error instanceof Error) {
        return error.message;
    }
    return defaultMessage;
}

export function getErrorCode(error: unknown): string | undefined {
    const data = getResponseData(error);
    if (data && typeof data === "object") {
        const code = (data as Record<string, unknown>).code;
        if (typeof code === "string") return code;
    }
    return undefined;
}

export function getServerErrors(error: unknown): ServerErrors | undefined {
    const data = getResponseData(error);
    if (!data || typeof data !== "object") return undefined;
    const obj = data as Record<string, unknown>;
    const raw = obj.errors;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        return normalizeStringArrays(raw as Record<string, unknown>);
    }
    // fallbacks
    const legacy: ServerErrors = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key === "detail" || key === "code" || key === "error" || key === "message") continue;
        if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
            legacy[key === "non_field_errors" ? FORM_LEVEL_ERROR_KEY : key] = value;
        }
    }
    return Object.keys(legacy).length > 0 ? legacy : undefined;
}

function normalizeStringArrays(input: Record<string, unknown>): ServerErrors {
    const out: ServerErrors = {};
    for (const [key, value] of Object.entries(input)) {
        if (Array.isArray(value)) {
            out[key] = value.filter((v): v is string => typeof v === "string");
        }
    }
    return out;
}

interface SetFormServerErrorsOptions<T extends FieldValues> {
    fieldMap?: Partial<Record<string, FieldPath<T>>>;
    focusFirst?: boolean;
}

export function setFormServerErrors<T extends FieldValues>(
    form: UseFormReturn<T>,
    error: unknown,
    options: SetFormServerErrorsOptions<T> = {},
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
            if (key === FORM_LEVEL_ERROR_KEY) {
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
