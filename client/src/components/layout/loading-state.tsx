import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingState({ message = "Loading...", size = "md" }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className={`animate-spin mx-auto text-primary ${sizeClasses[size]}`} />
        <p className="mt-3 text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}