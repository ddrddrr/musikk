import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/modules/app/App.tsx";
import ErrorBoundary from "@/modules/errors/ErrorBoundary.tsx";
import { CustomErrorPage } from "@/modules/errors/GenericErrorFallback.tsx";
import "./index.css";

const queryClient = new QueryClient();
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary fallback={<CustomErrorPage />}>
                <App />
            </ErrorBoundary>
        </QueryClientProvider>
    </StrictMode>,
);
