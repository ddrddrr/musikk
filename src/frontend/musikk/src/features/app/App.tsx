import { BrowserRouter, Route, Routes } from "react-router-dom";

import { HomePage } from "@/features/app/HomePage.tsx";
import { LoginPage } from "@/features/app/LoginPage.tsx";
import { MobileBlock } from "@/features/app/MobileBlock.tsx";
import { SettingsPage } from "@/features/app/SettingsPage.tsx";
import { SignUpPage } from "@/features/app/SignupPage.tsx";
import { useWebSocketListeners } from "@/features/app/useWebSocketListeners.ts";
import { EmailVerificationPage } from "@/features/auth/components/EmailVerificationPage.tsx";
import { RequireAuth } from "@/features/auth/components/RequireAuth.tsx";
import { AuthProvider } from "@/features/auth/providers/AuthProvider.tsx";
import { AuthenticatedLayout } from "@/features/layout/AuthenticatedLayout.tsx";
import { LoudnessPresetProvider } from "@/features/player/providers/LoudnessPresetProvider.tsx";
import { useIsMobile } from "@/hooks/useIsMobile.ts";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { DeviceListProvider } from "../playback/providers/DeviceListProvider";
import { PlaybackProvider } from "../playback/providers/PlaybackProvider";
import { AlbumUploadPage } from "./AlbumUploadPage.tsx";

function AuthenticatedApp() {
    useWebSocketListeners();
    return (
        <Routes>
            <Route element={<AuthenticatedLayout />}>
                <Route path="/*" element={<HomePage />} />
                <Route path="/upload" element={<AlbumUploadPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Route>
        </Routes>
    );
}

export function App() {
    const isMobile = useIsMobile();
    const onEmailConfirmation = window.location.pathname.startsWith("/email-confirmation/");
    if (isMobile && !onEmailConfirmation) {
        return <MobileBlock />;
    }
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route
                        path="email-confirmation/:confirmationKey"
                        element={<EmailVerificationPage />}
                    />
                    <Route
                        path="/*"
                        element={
                            <RequireAuth>
                                <WebSocketProvider>
                                    <DeviceListProvider>
                                        <PlaybackProvider>
                                            <LoudnessPresetProvider>
                                                <AuthenticatedApp />
                                            </LoudnessPresetProvider>
                                        </PlaybackProvider>
                                    </DeviceListProvider>
                                </WebSocketProvider>
                            </RequireAuth>
                        }
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
