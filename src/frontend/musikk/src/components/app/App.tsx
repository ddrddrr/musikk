import { BrowserRouter, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/auth/RequireAuth.tsx";
import { HomePage } from "@/components/app/HomePage.tsx";
import { LoginPage } from "@/components/app/LoginPage.tsx";
import { SettingsPage } from "@/components/app/SettingsPage.tsx";
import { UploadPage } from "@/components/app/UploadPage.tsx";

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
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
                <Route path="/login" element={<LoginPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>
        </BrowserRouter>
    );
}
