import { SignUpForm } from "@/features/auth/components/SignupForm.tsx";
import { Card, CardHeader, CardTitle } from "@/features/ui/card";

export function SignUpPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Card variant="panel" className="w-full max-w-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-center">Sign Up</CardTitle>
                </CardHeader>
                <SignUpForm />
            </Card>
        </div>
    );
}
