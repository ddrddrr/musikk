import { LoginForm } from "@/components/login/LoginForm";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Card className="border-2 border-black shadow-none w-full max-w-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
                </CardHeader>
                <LoginForm />
            </Card>
        </div>
    );
}
