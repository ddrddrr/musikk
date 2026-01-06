import { Button } from "@/features/ui/button";

export function CustomErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md rounded-2xl bg-white p-10 text-center shadow-lg">
                <h1 className="mb-4 text-3xl font-bold text-gray-900">Something went wrong</h1>
                <p className="mb-6 text-gray-600">An unexpected error occurred.</p>
                <a href="/" className="inline-block">
                    <Button>Go Home</Button>
                </a>
            </div>
        </div>
    );
}
