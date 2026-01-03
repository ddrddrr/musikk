import { LoginForm } from "@/features/auth/components/LoginForm.tsx";
import { Card, CardHeader, CardTitle } from "@/features/ui/card";

export function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Card variant="panel" className="w-full max-w-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
                </CardHeader>
                <LoginForm />
            </Card>
        </div>
    );
}
