import { setFormServerErrors } from "@/api/errorUtils.ts";
import { PublicationDraft } from "@/features/publications/api/mutations.ts";
import { AttachmentPicker } from "@/features/publications/components/AttachmentPicker.tsx";
import { useAttachment } from "@/features/publications/hooks/useAttachment.ts";
import { PublicationSchema } from "@/features/publications/schemas.ts";
import { Button } from "@/features/ui/button.tsx";
import { Textarea } from "@/features/ui/textarea.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type PublicationFormValues = z.infer<PublicationSchema>;

interface PublicationFormProps {
    schema: PublicationSchema;
    submitLabel: string;
    pendingLabel: string;
    placeholder?: string;
    replyPreview?: ReactNode;
    onTyping?: () => void;
    submit: (draft: PublicationDraft) => Promise<void>;
    onSuccess?: () => void;
}

export function PublicationForm({
    schema,
    submitLabel,
    pendingLabel,
    placeholder,
    replyPreview,
    onTyping,
    submit,
    onSuccess,
}: PublicationFormProps) {
    const form = useForm<PublicationFormValues>({
        resolver: zodResolver(schema),
    });
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = form;
    const contentField = register("content");
    const serverErrorMessage = errors.root?.serverError?.message;

    const { attachedObj, setAttachedObj, getAttachment, clearAttachment } = useAttachment();

    const submitHandler = async (values: PublicationFormValues) => {
        try {
            await submit({ content: values.content, attachment: getAttachment() });
        } catch (error) {
            setFormServerErrors(form, error);
            return;
        }
        reset();
        clearAttachment();
        onSuccess?.();
    };

    return (
        <form onSubmit={(e) => void handleSubmit(submitHandler)(e)} className="flex flex-col gap-2">
            {replyPreview}
            <Textarea
                {...contentField}
                onChange={(e) => {
                    void contentField.onChange(e);
                    if (onTyping && e.target.value.length > 0) onTyping();
                }}
                placeholder={placeholder}
                className="border border-foreground bg-card"
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            <AttachmentPicker attachedObj={attachedObj} onAttach={setAttachedObj} />
            {serverErrorMessage && <p className="text-xs text-destructive">{serverErrorMessage}</p>}
            <Button
                type="submit"
                variant="brand"
                className="rounded-sm px-4 py-2"
                disabled={isSubmitting}
            >
                {isSubmitting ? pendingLabel : submitLabel}
            </Button>
        </form>
    );
}
