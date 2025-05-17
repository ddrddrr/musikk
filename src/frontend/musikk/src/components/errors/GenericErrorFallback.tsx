import { Button } from "@/components/ui/button";

export function CustomErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white p-10 rounded-2xl shadow-lg max-w-md text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h1>
                <p className="text-gray-600 mb-6">An unexpected error occurred.</p>
                <a href="/" className="inline-block">
                    <Button>Go Home</Button>
                </a>
            </div>
        </div>
    );
}
