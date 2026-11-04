"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, WifiOff } from "lucide-react";

export default function GlobalError({
 error,
 reset,
}: {
 error: Error & { digest?: string };
 reset: () => void;
}) {
 useEffect(() => {
 // Log the error to an error reporting service
 console.error("Global Error Caught:", error);
 }, [error]);

  const isNetworkError =
    error.message === "NETWORK_ERROR" ||
    error.message.toLowerCase().includes("failed to fetch") ||
    error.message.toLowerCase().includes("network error") ||
    error.message.toLowerCase().includes("networkerror") ||
    error.message.toLowerCase().includes("econnrefused");

 return (
 <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
 <div className="max-w-md w-full text-center space-y-6">
 <div className="flex justify-center">
 <div className={`h-24 w-24 rounded-full flex items-center justify-center ${isNetworkError ? 'bg-orange-500/10 text-orange-500' : 'bg-destructive/10 text-destructive'}`}>
 {isNetworkError ? <WifiOff className="h-12 w-12" /> : <AlertTriangle className="h-12 w-12" />}
 </div>
 </div>
 
 <div className="space-y-2">
 <h1 className="text-3xl font-bold tracking-tight">
   {isNetworkError ? "You are offline" : "Something went wrong"}
 </h1>
 <p className="text-muted-foreground">
   {isNetworkError 
     ? "It looks like you lost your internet connection. Please check your network and try again."
     : "We apologize for the inconvenience. Our team has been notified and is looking into the issue."}
 </p>
 </div>

 {!isNetworkError && (
   <div className="p-4 bg-muted rounded-lg text-left text-sm font-mono overflow-auto max-h-32">
   <p className="text-muted-foreground truncate">{error.message || "An unexpected error occurred."}</p>
   </div>
 )}

 <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
 <button
 onClick={() => reset()}
 className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
 >
 <RefreshCw className="mr-2 h-4 w-4" />
 Try again
 </button>
 
 <Link
 href="/"
 className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
 >
 <Home className="mr-2 h-4 w-4" />
 Go to Homepage
 </Link>
 </div>
 </div>
 </div>
 );
}
