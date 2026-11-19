import React from "react";
import { AlertTriangle, RefreshCcw, RotateCcw } from "lucide-react";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  title?: string;
  compact?: boolean;
  onResetSession?: () => void;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "Unexpected rendering error.",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[AppErrorBoundary] Caught runtime error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  handleHardReset = () => {
    try {
      sessionStorage.removeItem("current_analysis_result");
      sessionStorage.removeItem("current_linkedin_trust_report");
      sessionStorage.removeItem("current_linkedin_trust_score");
    } catch {
      // ignore storage errors
    }
    if (this.props.onResetSession) {
      this.props.onResetSession();
    }
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.compact) {
      return (
        <div className="p-6 rounded-2xl border border-rose-300 dark:border-rose-800/60 bg-white dark:bg-[#111116] text-zinc-950 dark:text-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-700 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-950 dark:text-white">
                {this.props.fallbackTitle || this.props.title || "Section encountered a rendering issue"}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                {this.state.errorMessage || "Click Retry View to recover this panel."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-3.5 py-2 rounded-lg bg-zinc-100 dark:bg-[#16161d] hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-950 dark:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
            <span>Retry View</span>
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-950 dark:text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111116] p-8 space-y-5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-700 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                {this.props.fallbackTitle || this.props.title || "Workspace Interrupted"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                A view component hit an unexpected error. Your workspace can recover immediately.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-rose-700 dark:text-rose-300 break-words">
            {this.state.errorMessage}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Retry Rendering</span>
            </button>
            <button
              type="button"
              onClick={this.handleHardReset}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#16161d] hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Reset Cached Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export const PanelErrorBoundary = AppErrorBoundary;
