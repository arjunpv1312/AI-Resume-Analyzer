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
        <div className="dark dark-studio p-6 rounded-2xl border border-rose-500/30 bg-slate-900 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {this.props.fallbackTitle || this.props.title || "Section encountered a rendering issue"}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {this.state.errorMessage || "Click Retry View to recover this panel."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-teal-400" />
            <span>Retry View</span>
          </button>
        </div>
      );
    }

    return (
      <div className="dark dark-studio min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {this.props.fallbackTitle || this.props.title || "Workspace Interrupted"}
              </h2>
              <p className="text-xs text-slate-400">
                A view component hit an unexpected error. Your workspace can recover immediately.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300 break-words">
            {this.state.errorMessage}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Retry Rendering</span>
            </button>
            <button
              type="button"
              onClick={this.handleHardReset}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Cached Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export const PanelErrorBoundary = AppErrorBoundary;
