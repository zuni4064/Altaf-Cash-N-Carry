import { Loader2 } from "lucide-react";

export default function PageLoader() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center w-full">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
    );
}
