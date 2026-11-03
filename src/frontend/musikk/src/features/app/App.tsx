import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AlbumUploadPage } from "@/features/app/AlbumUploadPage.tsx";
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
import { DeviceListProvider } from "@/features/playback/providers/DeviceListProvider.tsx";
import { PlaybackProvider } from "@/features/playback/providers/PlaybackProvider.tsx";
import { useIsMobile } from "@/hooks/useIsMobile.ts";
import { WebSocketProvider } from "@/providers/WebSocketProvider.tsx";

function AuthenticatedApp() {
    useWebSocketListeners();
    return (
        <Routes>
            <Route element={<AuthenticatedLayout />}>
                <Route path="/*" element={<HomePage />} />
                <Route path="/upload" element={<AlbumUploadPage />} />
                <Route path="/upload/:albumUUID" element={<AlbumUploadPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Route>
        </Routes>
    );
}

export function App() {
    const isMobile = useIsMobile();
    if (isMobile) {
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
                                            <AuthenticatedApp />
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
