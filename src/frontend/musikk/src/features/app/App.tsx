import { BrowserRouter, Route, Routes } from "react-router-dom";

import { HomePage } from "@/features/app/HomePage.tsx";
import { LoginPage } from "@/features/app/LoginPage.tsx";
import { SettingsPage } from "@/features/app/SettingsPage.tsx";
import { SignUpPage } from "@/features/app/SignupPage.tsx";
import { EmailVerificationPage } from "@/features/auth/components/EmailVerificationPage.tsx";
import { RequireAuth } from "@/features/auth/components/RequireAuth.tsx";
import { AuthProvider } from "@/features/auth/providers/AuthProvider.tsx";
import { useDeviceLifecycle } from "@/features/playback/hooks/useDeviceLifecycle.ts";
import { useUserWsEvents } from "@/features/user/wsEvents.ts";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { useErrorEvent } from "@/ws/useErrorEvent.ts";
import { useQueryInvalidateEvent } from "@/ws/useQueryInvalidateEvent.ts";
import { DeviceListProvider } from "../playback/providers/DeviceListProvider";
import { PlaybackProvider } from "../playback/providers/PlaybackProvider";
import { useDeviceListEvent, usePlaybackChangeEvent } from "../playback/ws/eventHooks";
import { AlbumUploadPage } from "./AlbumUploadPage.tsx";

function AuthenticatedApp() {
    // TODO: move and centralize
    useQueryInvalidateEvent();
    useErrorEvent();
    useDeviceListEvent();
    usePlaybackChangeEvent();
    useDeviceLifecycle();
    useUserWsEvents();
    return (
        <Routes>
            <Route path="/*" element={<HomePage />} />
            <Route path="/upload" element={<AlbumUploadPage />} />
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
