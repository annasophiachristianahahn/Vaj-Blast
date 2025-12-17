import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-4 text-center text-white/80 bg-black/20 rounded-lg border border-white/10">
          <AlertTriangle className="w-10 h-10 text-yellow-500 mb-2" />
          <h2 className="text-lg font-bold">Something went wrong</h2>
          <p className="text-sm opacity-70 mb-4">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
