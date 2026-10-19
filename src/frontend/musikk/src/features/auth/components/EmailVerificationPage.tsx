import { useVerifyEmailQuery } from "@/features/auth/api.ts";
import { Button } from "@/features/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

type VerificationStatus = "loading" | "success" | "error" | "invalid";

const STATUS_MESSAGES: Record<VerificationStatus, string> = {
    loading: "Verifying your email address...",
    success: "Email confirmed successfully! You can now log in to your account.",
    error: "Failed to confirm email. The link may have expired or is invalid. Please try again or contact support.",
    invalid: "Invalid confirmation key.",
};

export function EmailVerificationPage() {
    const { confirmationKey } = useParams<{ confirmationKey: string }>();
    const navigate = useNavigate();
    const { isPending, isError } = useVerifyEmailQuery(confirmationKey);

    let status: VerificationStatus;
    if (!confirmationKey) {
        status = "invalid";
    } else if (isPending) {
        status = "loading";
    } else if (isError) {
        status = "error";
    } else {
        status = "success";
    }

    const getIcon = () => {
        switch (status) {
            case "loading":
                return <Loader2 className="size-16 animate-spin text-brand" />;
            case "success":
                return <CheckCircle2 className="size-16 text-success" />;
            case "error":
                return <XCircle className="size-16 text-destructive" />;
            case "invalid":
                return <AlertCircle className="size-16 text-destructive" />;
        }
    };

    const isFailed = status === "error" || status === "invalid";

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-2 border-foreground shadow-lg">
                <CardHeader className="border-b-2 border-foreground">
                    <CardTitle className="text-center text-2xl font-bold text-foreground">
                        Email Verification
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 pb-6">
                    <div className="flex flex-col items-center gap-6 text-center">
                        {getIcon()}
                        <p className={cn("text-lg", isFailed && "text-destructive")}>
                            {STATUS_MESSAGES[status]}
                        </p>
                        {status === "success" && (
                            <Button
                                variant="brand"
                                size="lg"
                                className="w-full"
                                onClick={() => void navigate("/login")}
                            >
                                Go to Login
                            </Button>
                        )}
                        {isFailed && (
                            <Button
                                variant="brand"
                                size="lg"
                                className="w-full"
                                onClick={() => void navigate("/signup")}
                            >
                                Back to Sign Up
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
