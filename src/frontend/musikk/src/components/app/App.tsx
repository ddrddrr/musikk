import { BrowserRouter, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/auth/RequireAuth.tsx";
import { HomePage } from "@/components/app/HomePage.tsx";
import { LoginPage } from "@/components/app/LoginPage.tsx";
import { SettingsPage } from "@/components/app/SettingsPage.tsx";
import { SignUpPage } from "@/components/app/SignupPage.tsx";
import { UploadPage } from "@/components/app/UploadPage.tsx";
import { UserProvider } from "@/providers/UserProvider.tsx";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { useHandleInvalidateEvent } from "./useHandleInvalidateEvent";

function AuthenticatedApp() {
    useHandleInvalidateEvent();

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
            <UserProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route
                        path="/*"
                        element={
                            <RequireAuth>
                                <WebSocketProvider>
                                    <AuthenticatedApp />
                                </WebSocketProvider>
                            </RequireAuth>
                        }
                    />
                </Routes>
            </UserProvider>
        </BrowserRouter>
    );
}
