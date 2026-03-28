import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/features/app/App.tsx";
import { ErrorBoundary } from "@/features/errors/ErrorBoundary.tsx";
import { CustomErrorPage } from "@/features/errors/GenericErrorFallback.tsx";
import "./index.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000,
            retry: 1,
        },
    },
});
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary fallback={<CustomErrorPage />}>
                <App />
            </ErrorBoundary>
        </QueryClientProvider>
    </StrictMode>,
);
