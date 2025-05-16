import { BrowserRouter, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/auth/RequireAuth.tsx";
import { HomePage } from "@/components/app/HomePage.tsx";
import { LoginPage } from "@/components/app/LoginPage.tsx";
import { SettingsPage } from "@/components/app/SettingsPage.tsx";
import { SignUpPage } from "@/components/app/SignupPage.tsx";
import { UploadPage } from "@/components/app/UploadPage.tsx";
import { UserProvider } from "@/providers/UserProvider.tsx";
import { memo } from "react";
import { useHandleLoadUnload } from "@/hooks/useHandleLoadUnload.tsx";

export const App = memo(function App() {
    useHandleLoadUnload()
    return (
        <BrowserRouter>
            <UserProvider>
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
                    <Route path="/signup" element={<SignUpPage />} />
                </Routes>
            </UserProvider>
        </BrowserRouter>
    );
});
