import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wand2,
  Layout,
  Table,
  Type,
  Check,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  AlignLeft,
  ChevronDown,
  Info,
  ShieldCheck,
  Zap,
} from "lucide-react";

export interface FormattingFixesState {
  standardizeMargins: boolean;
  removeComplexTables: boolean;
  convertToStandardFont: boolean;
  standardizeHeaders: boolean;
  selectedFont: "Inter" | "Arial" | "Calibri" | "Georgia";
}

export interface ResumeQuickFixToolbarProps {
  fixes: FormattingFixesState;
  onToggleFix: (fixKey: keyof Omit<FormattingFixesState, "selectedFont">) => void;
  onSelectFont: (font: "Inter" | "Arial" | "Calibri" | "Georgia") => void;
  onApplyAll: () => void;
  onReset: () => void;
  baseFormattingScore: number;
  effectiveFormattingScore: number;
  activeToastMessage?: string | null;
}

export const ResumeQuickFixToolbar: React.FC<ResumeQuickFixToolbarProps> = ({
  fixes,
  onToggleFix,
  onSelectFont,
  onApplyAll,
  onReset,
  baseFormattingScore,
  effectiveFormattingScore,
  activeToastMessage,
}) => {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const allActive =
    fixes.standardizeMargins &&
    fixes.removeComplexTables &&
    fixes.convertToStandardFont &&
    fixes.standardizeHeaders;

  const anyActive =
    fixes.standardizeMargins ||
    fixes.removeComplexTables ||
    fixes.convertToStandardFont ||
    fixes.standardizeHeaders;

  const activeCount = [
    fixes.standardizeMargins,
    fixes.removeComplexTables,
    fixes.convertToStandardFont,
    fixes.standardizeHeaders,
  ].filter(Boolean).length;

  return (
    <div className="sticky top-3 z-30 w-full max-w-4xl mx-auto px-2">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border border-indigo-500/35 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(99,102,241,0.18)] p-2.5 sm:p-3 text-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left Title & Status Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-indigo-500/30">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Quick Fix Toolbar
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase border border-indigo-500/30">
                  {activeCount}/4 Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                1-click automated ATS formatting & layout stabilization
              </p>
            </div>
          </div>

          {/* Center / Right: Formatting Health Score & All-in-One CTA */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold">ATS Health:</span>
              <span
                className={`font-mono font-black tabular-nums ${
                  effectiveFormattingScore >= 95
                    ? "text-emerald-400"
                    : effectiveFormattingScore >= 80
                    ? "text-teal-400"
                    : "text-amber-400"
                }`}
              >
                {effectiveFormattingScore}%
              </span>
              {effectiveFormattingScore >= 95 && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
              )}
            </div>

            <button
              type="button"
              onClick={onApplyAll}
              disabled={allActive}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                allActive
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default"
                  : "bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white shadow-teal-500/25"
              }`}
              title="Apply all ATS compliance formatting fixes simultaneously"
            >
              {allActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>All Fixes Applied</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                  <span>Apply All Fixes</span>
                </>
              )}
            </button>

            {anyActive && (
              <button
                type="button"
                onClick={onReset}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Reset formatting to raw upload state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Button Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-white/10">
          {/* Fix 1: Standardize Margins */}
          <button
            type="button"
            onClick={() => onToggleFix("standardizeMargins")}
            className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer group active:scale-98 ${
              fixes.standardizeMargins
                ? "bg-teal-500/15 border-teal-500/50 text-white shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-slate-300"
            }`}
            title="Set uniform 1.0 inch margins with standard ATS coordinate guides"
          >
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  fixes.standardizeMargins
                    ? "bg-teal-500/20 text-teal-300"
                    : "bg-white/5 text-slate-400 group-hover:text-white"
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>Standardize Margins</span>
                  {fixes.standardizeMargins && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/30 text-teal-200 font-mono">
                      1.0"
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">0.75" - 1" ATS Uniform Grid</div>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                fixes.standardizeMargins
                  ? "bg-teal-500 border-teal-400 text-slate-950"
                  : "border-slate-600 bg-transparent text-transparent group-hover:border-slate-400"
              }`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          </button>

          {/* Fix 2: Remove Complex Tables */}
          <button
            type="button"
            onClick={() => onToggleFix("removeComplexTables")}
            className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer group active:scale-98 ${
              fixes.removeComplexTables
                ? "bg-indigo-500/20 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-slate-300"
            }`}
            title="Linearize columns, grids, and pipe tables into single-column ATS semantic flow"
          >
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  fixes.removeComplexTables
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "bg-white/5 text-slate-400 group-hover:text-white"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>Remove Complex Tables</span>
                </div>
                <div className="text-[10px] text-slate-400">Linearize Multi-Column Data</div>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                fixes.removeComplexTables
                  ? "bg-indigo-500 border-indigo-400 text-white"
                  : "border-slate-600 bg-transparent text-transparent group-hover:border-slate-400"
              }`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          </button>

          {/* Fix 3: Convert to Standard Font */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleFix("convertToStandardFont")}
              className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer group active:scale-98 ${
                fixes.convertToStandardFont
                  ? "bg-purple-500/20 border-purple-500/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-slate-300"
              }`}
              title="Apply certified ATS web-safe font (Arial, Calibri, Inter, or Georgia)"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    fixes.convertToStandardFont
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-white/5 text-slate-400 group-hover:text-white"
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    <span>Convert Standard Font</span>
                    {fixes.convertToStandardFont && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-mono">
                        {fixes.selectedFont}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">Universal ATS Typography</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {fixes.convertToStandardFont && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFontDropdown(!showFontDropdown);
                    }}
                    className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
                    title="Choose ATS font family"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    fixes.convertToStandardFont
                      ? "bg-purple-500 border-purple-400 text-white"
                      : "border-slate-600 bg-transparent text-transparent group-hover:border-slate-400"
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>
            </button>

            {/* Font Picker Menu */}
            {showFontDropdown && fixes.convertToStandardFont && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 space-y-1">
                {(["Inter", "Arial", "Calibri", "Georgia"] as const).map((font) => (
                  <button
                    key={font}
                    type="button"
                    onClick={() => {
                      onSelectFont(font);
                      setShowFontDropdown(false);
                    }}
                    className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                      fixes.selectedFont === font
                        ? "bg-purple-500/20 text-purple-300 font-bold"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span>{font} (ATS Certified)</span>
                    {fixes.selectedFont === font && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Toast / Feedback Notification */}
        <AnimatePresence>
          {activeToastMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-xs text-teal-300"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{activeToastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
