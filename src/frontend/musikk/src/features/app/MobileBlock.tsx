import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/card.tsx";

export function MobileBlock() {
    return (
        <div className="flex min-h-svh items-center justify-center bg-background p-6">
            <Card variant="panel" className="max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-xl">Desktop only</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>Musikk is not available on mobile devices yet.</p>
                    <p>Please open the app on a desktop or a larger screen.</p>
                </CardContent>
            </Card>
        </div>
    );
}
