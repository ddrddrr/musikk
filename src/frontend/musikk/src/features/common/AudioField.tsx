import { FileField, FileFieldProps } from "./FileField";

type SimpleFieldProps = Omit<FileFieldProps, "accept" | "label">;

const ALLOWED_FILE_TYPES =
    ".wav,.flac,.aiff,.aif,.m4a,.mp3,.ogg,.opus,.aac," +
    "audio/wav,audio/flac,audio/aiff,audio/x-flac,audio/mp4," +
    "audio/mpeg,audio/mp3,audio/ogg,audio/opus,audio/aac";

export function AudioField(props: SimpleFieldProps & { label?: string }) {
    return <FileField {...props} accept={ALLOWED_FILE_TYPES} label={props.label ?? "Audio"} />;
}
