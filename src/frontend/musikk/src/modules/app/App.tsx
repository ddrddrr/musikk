import { BrowserRouter, Route, Routes } from "react-router-dom";

import { HomePage } from "@/modules/app/HomePage.tsx";
import { LoginPage } from "@/modules/app/LoginPage.tsx";
import { SettingsPage } from "@/modules/app/SettingsPage.tsx";
import { SignUpPage } from "@/modules/app/SignupPage.tsx";
import { UploadPage } from "@/modules/app/UploadPage.tsx";
import { EmailVerificationPage } from "@/modules/auth/components/EmailVerificationPage.tsx";
import { RequireAuth } from "@/modules/auth/components/RequireAuth.tsx";
import { AuthProvider } from "@/modules/auth/providers/AuthProvider.tsx";
import { useDeviceLifecycle } from "@/modules/playback/hooks/useDeviceLifecycle.ts";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { useQueryInvalidateEvent } from "@/ws/useQueryInvalidateEvent.ts";
import { DeviceListProvider } from "../playback/providers/DeviceListProvider";
import { PlaybackProvider } from "../playback/providers/PlaybackProvider";
import { useDeviceListEvent, usePlaybackChangeEvent } from "../playback/ws/eventHooks";

function AuthenticatedApp() {
    // TODO: probably move and centralize
    useQueryInvalidateEvent();
    useDeviceListEvent();
    usePlaybackChangeEvent();
    useDeviceLifecycle();
    return (
        <Routes>
            <Route path="/*" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/settings" element={<SettingsPage />} />
        </Routes>
    );
}

export function App() {
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
