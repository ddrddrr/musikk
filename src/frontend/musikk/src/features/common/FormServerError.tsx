export function FormServerError({ message }: { message: string | undefined }) {
    if (!message) return null;

    return (
        <div className="rounded-sm border-2 border-destructive bg-destructive p-4 font-medium text-destructive-foreground">
            {message}
        </div>
    );
}
