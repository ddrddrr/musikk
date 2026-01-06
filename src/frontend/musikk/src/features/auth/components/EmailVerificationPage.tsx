import { verifyEmail } from "@/features/auth/api.ts";
import { Button } from "@/features/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/card.tsx";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type VerificationStatus = "loading" | "success" | "error" | "invalid";

export function EmailVerificationPage() {
    const { confirmationKey } = useParams<{ confirmationKey: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<VerificationStatus>("loading");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        if (!confirmationKey) {
            setStatus("invalid");
            setMessage("Invalid confirmation key.");
            return;
        }

        const runConfirmation = async () => {
            setStatus("loading");
            setMessage("Verifying your email address...");
            try {
                await verifyEmail(confirmationKey);
                setStatus("success");
                setMessage("Email confirmed successfully! You can now log in to your account.");
            } catch (error) {
                console.error("Email confirmation failed", error);
                setStatus("error");
                setMessage(
                    "Failed to confirm email. The link may have expired or is invalid. Please try again or contact support.",
                );
            }
        };

        void runConfirmation();
    }, [confirmationKey]);

    const getIcon = () => {
        switch (status) {
            case "loading":
                return <Loader2 className="h-16 w-16 animate-spin text-red-600" />;
            case "success":
                return <CheckCircle2 className="h-16 w-16 text-green-600" />;
            case "error":
                return <XCircle className="h-16 w-16 text-red-600" />;
            case "invalid":
                return <AlertCircle className="h-16 w-16 text-red-600" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case "loading":
                return "text-gray-700";
            case "success":
                return "text-green-700";
            case "error":
            case "invalid":
                return "text-red-700";
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md border-2 border-red-600 shadow-lg">
                <CardHeader className="border-b-2 border-red-600">
                    <CardTitle className="text-center text-2xl font-bold text-gray-900">
                        Email Verification
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 pb-6">
                    <div className="flex flex-col items-center gap-6 text-center">
                        {getIcon()}
                        <p className={`text-lg font-medium ${getStatusColor()}`}>{message}</p>
                        {status === "success" && (
                            <Button
                                variant="brand"
                                size="lg"
                                className="w-full"
                                onClick={() => navigate("/login")}
                            >
                                Go to Login
                            </Button>
                        )}
                        {(status === "error" || status === "invalid") && (
                            <Button
                                variant="brand"
                                size="lg"
                                className="w-full"
                                onClick={() => navigate("/signup")}
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
