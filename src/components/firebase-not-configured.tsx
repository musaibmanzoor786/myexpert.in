import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function FirebaseNotConfigured() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-2xl mt-4">Firebase Not Configured</CardTitle>
          <CardDescription>
            It looks like your Firebase environment variables are missing.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm space-y-4">
          <p>
            Please add your Firebase project configuration to the <code className="bg-muted px-1 py-0.5 rounded">.env</code> file to enable authentication and database features.
          </p>
          <p>
            You can find these keys in your Firebase project settings. Make sure to restart the development server after updating the <code className="bg-muted px-1 py-0.5 rounded">.env</code> file.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
