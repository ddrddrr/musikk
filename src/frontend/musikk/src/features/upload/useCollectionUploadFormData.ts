import type { UUID } from "@/api/types";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID";
import { createCollection, createSong } from "@/features/upload/mutations";
import type {
    CreateState,
    StatusByUUId,
    UploadEventPayload,
} from "@/features/upload/ws/eventHooks";
import { useSongUploadEvent } from "@/features/upload/ws/eventHooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FieldPath } from "react-hook-form";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import {
    CollectionUploadFormValues,
    CollectionUploadSchemaDraft,
    CollectionUploadSchemaFinal,
} from "./schemas";
import { isUploadErr, type UploadOk } from "./utils";

type SubmitStatus = "idle" | "submitting" | "success" | "error";
type SubmitState = { status: SubmitStatus; message?: string; resetIn?: number };

const DEFAULT_VALUES: CollectionUploadFormValues = {
    titleSize: "",
    private: false,
    description: "",
    image: undefined,
    songs: [{ titleSize: "", description: "", audio: new File([], ""), image: undefined }],
};

export function useCollectionUploadFormData() {
    const userUUID = useUserUUID();

    const form = useForm<CollectionUploadFormValues>({
        resolver: zodResolver(CollectionUploadSchemaDraft),
        defaultValues: DEFAULT_VALUES,
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "songs" });

    const [songsStateByFieldId, setSongsStateByFieldId] = useState<CreateState>({});
    const [statusByUUID, setStatusByUUID] = useState<StatusByUUId>({});
    const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

    const resetTimeoutRef = useRef<number | null>(null);
    const resetIntervalRef = useRef<number | null>(null);

    const clearSubmitTimers = useCallback(() => {
        if (resetTimeoutRef.current) window.clearTimeout(resetTimeoutRef.current);
        if (resetIntervalRef.current) window.clearInterval(resetIntervalRef.current);
        resetTimeoutRef.current = null;
        resetIntervalRef.current = null;
    }, []);

    useEffect(() => {
        return () => clearSubmitTimers();
    }, [clearSubmitTimers]);

    const resetAll = useCallback(() => {
        clearSubmitTimers();
        setSubmitState({ status: "idle" });
        setSongsStateByFieldId({});
        setStatusByUUID({});
        form.reset(DEFAULT_VALUES);
    }, [clearSubmitTimers, form]);

    const onWsEvent = useCallback((p: UploadEventPayload) => {
        setStatusByUUID((prev) => ({ ...prev, [p.uuid]: p }));
    }, []);
    useSongUploadEvent(onWsEvent);

    const songs = useWatch({ control: form.control, name: "songs" }) ?? [];
    const title = useWatch({ control: form.control, name: "title" }) ?? "";

    const canSubmit = useMemo(() => {
        if (title.trim().length === 0) return false;
        if (songs.length === 0) return false;
        return songs.every((s) => s.uuid && statusByUUID[s.uuid]?.status === "ready");
    }, [songs, statusByUUID, title]);

    const clearFieldCreateState = useCallback((fieldId: string) => {
        setSongsStateByFieldId((prev) => {
            if (!(fieldId in prev)) return prev;
            const next = { ...prev };
            delete next[fieldId];
            return next;
        });
    }, []);

    const clearUuidStatus = useCallback((uuid?: UUID) => {
        if (!uuid) return;
        setStatusByUUID((prev) => {
            if (!(uuid in prev)) return prev;
            const next = { ...prev };
            delete next[uuid];
            return next;
        });
    }, []);

    const removeSong = useCallback(
        (i: number, fieldId: string) => {
            const uuid = form.getValues(`songs.${i}.uuid`) ?? songs?.[i]?.uuid;

            clearUuidStatus(uuid);
            clearFieldCreateState(fieldId);
            remove(i);
        },
        [clearFieldCreateState, clearUuidStatus, form, remove, songs],
    );

    const appendSong = useCallback(() => {
        append({ titleSize: "", description: "", audio: new File([], ""), image: undefined });
    }, [append]);

    const uploadSongs = useCallback(
        async (data: CollectionUploadFormValues) => {
            setSongsStateByFieldId((prev) => {
                const next = { ...prev };
                fields.forEach((f, i) => {
                    if (!data.songs[i]?.uuid) next[f.id] = { status: "creating" };
                });
                return next;
            });

            const uploadJobs = data.songs.map(async (song, i): Promise<UploadOk> => {
                const fieldId = fields[i]?.id;
                if (!fieldId) throw { i, fieldId: "unknown", error: new Error("missing fieldId") };

                try {
                    if (song.uuid) return { i, fieldId, uuid: song.uuid };
                    const { uuid } = await createSong(song);
                    return { i, fieldId, uuid: uuid as UUID };
                } catch (error) {
                    throw { i, fieldId, error };
                }
            });

            const results = await Promise.allSettled(uploadJobs);

            results.forEach((r) => {
                if (r.status === "fulfilled") {
                    const { i, fieldId, uuid } = r.value;

                    form.setValue(`songs.${i}.uuid`, uuid, { shouldDirty: true });

                    setStatusByUUID((prev) => {
                        const existing = prev[uuid]?.status;
                        if (
                            existing === "processing" ||
                            existing === "ready" ||
                            existing === "failed"
                        ) {
                            return prev;
                        }
                        return { ...prev, [uuid]: { uuid, status: "queued" } };
                    });

                    clearFieldCreateState(fieldId);
                    return;
                }

                const reason = r.reason as unknown;
                if (isUploadErr(reason)) {
                    setSongsStateByFieldId((prev) => ({
                        ...prev,
                        [reason.fieldId]: { status: "failed", detail: "Create failed" },
                    }));
                    return;
                }

                console.warn("Unhandled upload error", r.reason);
            });
        },
        [clearFieldCreateState, fields, form],
    );

    const startResetCountdown = useCallback(() => {
        clearSubmitTimers();

        setSubmitState((prev) => ({
            ...prev,
            resetIn: 5,
        }));

        resetIntervalRef.current = window.setInterval(() => {
            setSubmitState((prev) => {
                if (prev.status !== "success") return prev;
                const next = (prev.resetIn ?? 0) - 1;
                return { ...prev, resetIn: Math.max(0, next) };
            });
        }, 1000);

        resetTimeoutRef.current = window.setTimeout(() => {
            resetAll();
        }, 5000);
    }, [clearSubmitTimers, resetAll]);

    const submitCollection = useCallback(
        async (data: CollectionUploadFormValues) => {
            setSubmitState({ status: "submitting" });

            const parsed = CollectionUploadSchemaFinal.safeParse(data);

            if (!parsed.success) {
                parsed.error.issues.forEach((issue) => {
                    const name = issue.path.join(".") as FieldPath<CollectionUploadFormValues>;
                    form.setError(name, { type: "manual", message: issue.message });
                });
                setSubmitState({
                    status: "error",
                    message: "Validation failed. Fix the errors above.",
                });
                return;
            }

            try {
                const songUuids = parsed.data.songs.map((s) => s.uuid!);

                await createCollection({
                    type: "album",
                    private: parsed.data.private,
                    titleSize: parsed.data.titleSize,
                    description: parsed.data.description,
                    image: parsed.data.image,
                    authors: [userUUID],
                    songs: songUuids,
                });

                setSubmitState({
                    status: "success",
                    message: "Collection created successfully. Resetting in 5s.",
                    resetIn: 5,
                });

                startResetCountdown();
            } catch (e) {
                setSubmitState({
                    status: "error",
                    message: "Submit failed. Please try again.",
                });
                console.warn("createCollection failed", e);
            }
        },
        [form, startResetCountdown, userUUID],
    );

    return {
        form,
        fields,
        songs,
        statusByUUID,
        songsStateByFieldId,
        canSubmit,
        appendSong,
        removeSong,
        uploadSongs,
        submitCollection,
        submitState,
        resetAll,
    };
}
