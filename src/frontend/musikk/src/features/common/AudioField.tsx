import { FileField, FileFieldProps } from "./FileField";

type SimpleFieldProps = Omit<FileFieldProps, "accept" | "label">;

export function AudioField(props: SimpleFieldProps & { label?: string }) {
    return <FileField {...props} accept="audio/*" label={props.label ?? "Audio"} />;
}
