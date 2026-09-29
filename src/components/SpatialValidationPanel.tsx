import React, { useState } from 'react';
import { ValidationIssue, ValidationSummary } from '../types/cadastral';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, RefreshCw, ShieldAlert, Navigation, Search } from 'lucide-react';

interface SpatialValidationPanelProps {
  issues: ValidationIssue[];
  summary: ValidationSummary | null;
  onReRunValidation: () => void;
  onUpdateReview: (id: string, status: string, note?: string) => void;
  onViewEntity: (entityType: string, entityId: string) => void;
}

export default function SpatialValidationPanel({ issues, summary, onReRunValidation, onUpdateReview, onViewEntity }: SpatialValidationPanelProps) {
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssue | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const validCount = summary?.passed || 0;
  const warningCount = summary?.warnings || 0;
  const invalidCount = summary?.errors || 0;
  const requiresReviewCount = summary?.requiresReview || 0;

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-slate-950 text-white overflow-hidden p-6 gap-6">
      {/* Left Summary Sidebar */}
      <div className="w-full md:w-80 glass-strong rounded-2xl border border-cyber/20 p-5 space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Spatial Validation Engine</h2>
              <p className="text-[10px] text-slate-400 font-mono">Topology & Volumetric Rules</p>
            </div>
          </div>

          <button
            onClick={async () => {
              setIsRunning(true);
              await onReRunValidation();
              setIsRunning(false);
              setSelectedIssue(null);
            }}
            disabled={isRunning}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald to-cyber text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all glow-emerald disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} /> 
            {isRunning ? 'VALIDATING...' : 'Re-Run Spatial Validation Rules'}
          </button>

          {/* Stat summary grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-emerald/10 border border-emerald/30 text-center">
              <span className="text-lg font-mono font-bold text-emerald">{validCount}</span>
              <p className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">Valid</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <span className="text-lg font-mono font-bold text-amber-400">{warningCount}</span>
              <p className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">Warnings</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center">
              <span className="text-lg font-mono font-bold text-rose-400">{invalidCount}</span>
              <p className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">Invalid</p>
            </div>
          </div>
        </div>

        {/* Demo Disclaimer Box */}
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs space-y-1">
          <p className="text-amber-300 font-bold flex items-center gap-1.5 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Demo Topology Inspection
          </p>
          <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
            Spatial checks confirm geometric enclosure and prevent volumetric overlap. Validation does not constitute legal title determination.
          </p>
        </div>
      </div>

      {/* Main Validation Check List */}
      <div className="flex-1 glass-strong rounded-2xl border border-cyber/20 p-6 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald" /> Automated 3D Volumetric Consistency Checks
          </h2>
          <span className="text-[10px] font-mono text-slate-400">Rule Engine v1.0 · SIH26011</span>
        </div>

        <div className="space-y-3">
          {issues.map((res) => {
            const isWarning = res.status === 'WARNING';
            const isInvalid = res.status === 'FAILED';
            const isValid = res.status === 'PASSED';
            const isSelected = selectedIssue?.id === res.id;

            return (
              <div
                key={res.id}
                onClick={() => setSelectedIssue(res)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected ? 'border-cyber shadow-[0_0_15px_rgba(0,255,170,0.2)] ' : ''
                } ${
                  isWarning
                    ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
                    : isInvalid
                    ? 'bg-rose-500/10 border-rose-500/40 hover:bg-rose-500/20'
                    : 'glass border-slate-800 hover:bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isValid && <CheckCircle2 className="w-5 h-5 text-emerald" />}
                      {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                      {isInvalid && <XCircle className="w-5 h-5 text-rose-400" />}
                      {(!isValid && !isWarning && !isInvalid) && <AlertTriangle className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        {res.ruleId}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {res.category}
                        </span>
                        {res.requiresReview && res.reviewStatus !== 'RESOLVED' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                            {res.reviewStatus}
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-300 font-mono mt-1">{res.message}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">Entity: {res.entityType} {res.entityId}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold font-mono ${
                      isValid
                        ? 'bg-emerald/15 text-emerald border border-emerald/30'
                        : isWarning
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : isInvalid
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {res.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Right Details Sidebar */}
      {selectedIssue && (
        <div className="w-full md:w-96 glass-strong rounded-2xl border border-cyber/20 p-5 overflow-y-auto space-y-6 animate-fade-in">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-white">Issue Details</h3>
              <button onClick={() => setSelectedIssue(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-mono">Rule</p>
                <p className="text-xs font-mono text-white">{selectedIssue.ruleId}</p>
              </div>
              
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-mono">Message</p>
                <p className="text-xs text-amber-200">{selectedIssue.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Entity Type</p>
                  <p className="text-xs font-mono text-white">{selectedIssue.entityType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Entity ID</p>
                  <p className="text-xs font-mono text-white break-all">{selectedIssue.entityId}</p>
                </div>
              </div>

              {selectedIssue.details && Object.keys(selectedIssue.details).length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Computed Details</p>
                  <pre className="text-[10px] font-mono bg-slate-900/50 p-2 rounded mt-1 overflow-x-auto text-emerald-400">
                    {JSON.stringify(selectedIssue.details, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <p className="text-[10px] text-slate-500 uppercase font-mono">Source</p>
                <p className="text-xs font-mono text-cyan-400">{selectedIssue.source}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={() => onViewEntity(selectedIssue.entityType, selectedIssue.entityId)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-mono text-[10px] flex items-center justify-center gap-2 transition-colors"
            >
              <Navigation className="w-3 h-3" /> View {selectedIssue.entityType} on Map
            </button>

            {selectedIssue.requiresReview && (
              <div className="p-3 border border-amber-500/30 rounded-lg bg-amber-950/20 space-y-3">
                <p className="text-[10px] font-mono text-amber-400 flex items-center gap-2">
                  <Search className="w-3 h-3" /> Review Workflow
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedIssue.reviewStatus === 'OPEN' && (
                    <button
                      onClick={() => {
                        onUpdateReview(selectedIssue.id, 'UNDER_REVIEW');
                        setSelectedIssue({...selectedIssue, reviewStatus: 'UNDER_REVIEW'});
                      }}
                      className="flex-1 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 border border-blue-500/50 rounded font-mono text-[10px]"
                    >
                      Start Review
                    </button>
                  )}
                  {selectedIssue.reviewStatus === 'UNDER_REVIEW' && (
                    <>
                      <button
                        onClick={() => {
                          onUpdateReview(selectedIssue.id, 'RESOLVED');
                          setSelectedIssue({...selectedIssue, reviewStatus: 'RESOLVED'});
                        }}
                        className="flex-1 py-1.5 bg-emerald/20 hover:bg-emerald/40 text-emerald border border-emerald/50 rounded font-mono text-[10px]"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => {
                          onUpdateReview(selectedIssue.id, 'DISMISSED');
                          setSelectedIssue({...selectedIssue, reviewStatus: 'DISMISSED'});
                        }}
                        className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-500 rounded font-mono text-[10px]"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {(selectedIssue.reviewStatus === 'RESOLVED' || selectedIssue.reviewStatus === 'DISMISSED') && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      Issue marked as {selectedIssue.reviewStatus}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
