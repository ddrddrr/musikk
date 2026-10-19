import { FileField, FileFieldProps } from "@/features/common/FileField.tsx";

type SimpleFieldProps = Omit<FileFieldProps, "accept" | "label">;

export function ImageField(props: SimpleFieldProps & { label?: string }) {
    return <FileField {...props} accept="image/*" label={props.label ?? "Image"} />;
}
