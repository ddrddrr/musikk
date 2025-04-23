import { BrowserRouter, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/auth/RequireAuth.tsx";
import { HomePage } from "@/components/app/HomePage.tsx";
import { LoginPage } from "@/components/app/LoginPage.tsx";
import { SettingsPage } from "@/components/app/SettingsPage.tsx";
import { UploadPage } from "@/components/app/UploadPage.tsx";
import { PlaybackProvider } from "@/providers/PlaybackProvider.tsx";
import { UserProvider } from "@/providers/UserProvider.tsx";

export function App() {
    return (
        <BrowserRouter>
            <UserProvider>
                <PlaybackProvider>
                    <Routes>
                        <Route
                            path="/*"
                            element={
                                <RequireAuth>
                                    <HomePage />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/upload"
                            element={
                                <RequireAuth>
                                    <UploadPage />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/settings"
                            element={
                                <RequireAuth>
                                    <SettingsPage />
                                </RequireAuth>
                            }
                        />

                        <Route path="/login" element={<LoginPage />} />
                    </Routes>
                </PlaybackProvider>
            </UserProvider>
        </BrowserRouter>
    );
}
