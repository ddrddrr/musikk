import { BrowserRouter, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/auth/RequireAuth.tsx";
import { HomePage } from "@/components/app/HomePage.tsx";
import { LoginPage } from "@/components/app/LoginPage.tsx";
import { SettingsPage } from "@/components/app/SettingsPage.tsx";
import { UploadPage } from "@/components/app/UploadPage.tsx";
import { PlaybackProvider } from "@/providers/PlaybackProvider.tsx";
import { UserCollectionsProvider } from "@/providers/UserCollectionsProvider.tsx";
import { UserProvider } from "@/providers/UserProvider.tsx";
import { memo } from "react";

export const App = memo(function App() {
    return (
        <BrowserRouter>
            <UserProvider>
                <Routes>
                    <Route
                        path="/*"
                        element={
                            <PlaybackProvider>
                                <UserCollectionsProvider>
                                    <RequireAuth>
                                        <HomePage />
                                    </RequireAuth>
                                </UserCollectionsProvider>
                            </PlaybackProvider>
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
            </UserProvider>
        </BrowserRouter>
    );
});
