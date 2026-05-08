import { LoginForm } from "@/features/auth/components/LoginForm.tsx";
import { Card, CardHeader, CardTitle } from "@/features/ui/card";

export function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <Card variant="panel" className="w-full max-w-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-center text-2xl font-bold">Login</CardTitle>
                </CardHeader>
                <LoginForm />
            </Card>
        </div>
    );
}
