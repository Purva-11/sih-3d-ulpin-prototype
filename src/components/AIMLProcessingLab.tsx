import React, { useState } from 'react';
import { Cpu, Play, CheckCircle2, ShieldCheck, Layers, Box, Loader2, ArrowRight, Eye, Check, X, MapPin, AlertTriangle, AlertCircle } from 'lucide-react';
import { AIJobResult } from '../types/cadastral';

interface AIMLProcessingLabProps {
  jobs: AIJobResult[];
  onTriggerSegmentation: () => void;
}

type ModuleTab = 'EXTRACTION' | 'SEGMENTATION' | 'ASSOCIATION' | 'VALIDATION';

export default function AIMLProcessingLab({ jobs, onTriggerSegmentation }: AIMLProcessingLabProps) {
  const [activeModule, setActiveModule] = useState<ModuleTab>('EXTRACTION');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobs[0]?.id || null);
  const [simulating, setSimulating] = useState(false);
  const [reviewState, setReviewState] = useState<'PENDING' | 'ACCEPTED' | 'REJECTED'>('PENDING');

  const activeJob = jobs.find((j) => j.id === selectedJobId) || jobs.find(j => 
    (activeModule === 'EXTRACTION' && j.capability === 'Building Extraction') ||
    (activeModule === 'SEGMENTATION' && j.capability === 'Floor Segmentation') ||
    (activeModule === 'ASSOCIATION' && j.capability === 'Parcel Association') ||
    (activeModule === 'VALIDATION' && j.capability === 'Topology Validation')
  ) || jobs[0];

  const handleRunSimulation = () => {
    setSimulating(true);
    setReviewState('PENDING');
    setTimeout(() => {
      setSimulating(false);
      if (activeModule === 'SEGMENTATION') {
        // We do not immediately trigger segmentation view change, we leave that to human review or manual action
      }
    }, 1500);
  };

  const handleAccept = () => {
    setReviewState('ACCEPTED');
    if (activeModule === 'SEGMENTATION') {
      setTimeout(() => onTriggerSegmentation(), 800);
    }
  };

  const handleReject = () => {
    setReviewState('REJECTED');
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-white overflow-hidden p-6 gap-6 relative">
      
      {/* Top Header & Pipeline Visualizer */}
      <div className="w-full glass-strong rounded-2xl border border-cyber/20 p-5 flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI / ML Processing Lab</h2>
              <p className="text-xs text-slate-400 font-mono">BHOOMI-3D Automated Cadastral Pipelines</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(['EXTRACTION', 'SEGMENTATION', 'ASSOCIATION', 'VALIDATION'] as ModuleTab[]).map((mod) => (
              <button
                key={mod}
                onClick={() => { setActiveModule(mod); setReviewState('PENDING'); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                  activeModule === mod
                    ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mod === 'EXTRACTION' && 'BUILDING EXTRACTION'}
                {mod === 'SEGMENTATION' && 'FLOOR SEGMENTATION'}
                {mod === 'ASSOCIATION' && 'PARCEL ASSOCIATION'}
                {mod === 'VALIDATION' && 'SPATIAL ANOMALY DETECTION'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-widest text-slate-500 pt-2 border-t border-slate-800">
          <span className="text-purple-400 font-bold">DATA</span>
          <ArrowRight className="w-3 h-3" />
          <span className="text-cyan-400 font-bold">AI / ML</span>
          <ArrowRight className="w-3 h-3" />
          <span className="text-amber-400 font-bold">GEOMETRY</span>
          <ArrowRight className="w-3 h-3" />
          <span className="text-rose-400 font-bold">VALIDATION</span>
          <ArrowRight className="w-3 h-3" />
          <span className="text-emerald font-bold">REVIEW</span>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* Main Content Area */}
        <div className="flex-1 glass-strong rounded-2xl border border-cyber/20 p-6 flex flex-col overflow-y-auto">
          
          <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {activeModule === 'EXTRACTION' && 'Building Footprint Extraction'}
                {activeModule === 'SEGMENTATION' && 'Vertical Structure Segmentation'}
                {activeModule === 'ASSOCIATION' && 'Parcel–Building Spatial Association'}
                {activeModule === 'VALIDATION' && 'Intelligent Topology Validation'}
                {activeJob?.provenanceStatus === 'SIMULATED' && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
                    DEMO / SYNTHETIC
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Model: <span className="text-purple-300 font-bold">{activeJob?.modelName || 'N/A'}</span> | 
                Source: <span className="text-emerald">{activeJob?.inputSource || 'N/A'}</span>
              </p>
            </div>
            
            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs shadow-lg hover:scale-105 transition-all disabled:opacity-50"
            >
              {simulating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> MODEL INFERENCE...</>
              ) : (
                <><Play className="w-4 h-4 fill-white" /> RUN INFERENCE (DEMO)</>
              )}
            </button>
          </div>

          {/* Module Specific Preview */}
          <div className="flex-1 min-h-[300px] bg-[#0F172A] border border-slate-800 rounded-xl relative overflow-hidden mb-6">
            {!simulating && (
              <>
                {/* Visualizations for each module */}
                {activeModule === 'EXTRACTION' && (
                  <div className="absolute inset-0 flex flex-col p-6">
                    <div className="flex-1 border-2 border-dashed border-emerald/30 rounded-xl flex items-center justify-center bg-[url('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/79.0882,21.1458,17.5/800x400?access_token=DEMO')] bg-cover bg-center relative">
                       <div className="absolute inset-0 bg-slate-900/50"></div>
                       <div className="absolute w-32 h-32 border-2 border-emerald bg-emerald/20 transform rotate-12 flex items-center justify-center">
                         <span className="text-[10px] font-mono font-bold text-white bg-black/50 px-2 py-1">BUILDING CANDIDATE</span>
                       </div>
                    </div>
                    <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-300">
                      Output: 18 candidate building footprints.<br/>
                      Status: MODEL INFERENCE<br/>
                      Data status: NON-AUTHORITATIVE
                    </div>
                  </div>
                )}

                {activeModule === 'SEGMENTATION' && (
                  <div className="absolute inset-0 flex flex-col p-6 items-center justify-center gap-4">
                     <Layers className="w-16 h-16 text-emerald opacity-50" />
                     <div className="text-center">
                       <h3 className="font-bold text-white mb-2">Available Data: Building Height, LiDAR</h3>
                       <p className="text-xs text-slate-400 font-mono">Floors detected: 5</p>
                       <p className="text-xs text-slate-400 font-mono">Vertical extent: 16 m</p>
                     </div>
                     <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 w-full">
                       <span className="text-amber-500 font-bold">Prototype floor elevation used.</span><br/>
                       Result: DEMO / SYNTHETIC
                     </div>
                  </div>
                )}

                {activeModule === 'ASSOCIATION' && (
                  <div className="absolute inset-0 flex flex-col p-6 items-center justify-center gap-6">
                     <div className="flex items-center gap-8">
                        <div className="text-center">
                           <Box className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                           <span className="font-mono text-xs font-bold block">BLD-NGP-402A-01</span>
                        </div>
                        <div className="flex flex-col items-center">
                           <span className="text-[10px] text-amber-500 font-bold">INTERSECTS</span>
                           <ArrowRight className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="text-center">
                           <MapPin className="w-12 h-12 text-emerald mx-auto mb-2" />
                           <span className="font-mono text-xs font-bold block">PARCEL 402/A</span>
                        </div>
                     </div>
                     <p className="text-xs text-slate-400 font-mono">Status: SPATIAL ASSOCIATION</p>
                  </div>
                )}

                {activeModule === 'VALIDATION' && (
                  <div className="absolute inset-0 flex flex-col p-6 gap-3 overflow-y-auto">
                    <div className="p-3 border border-emerald/30 bg-emerald/10 rounded-lg flex gap-3 items-center">
                       <CheckCircle2 className="w-5 h-5 text-emerald" />
                       <span className="text-xs font-mono">Parcel geometry valid</span>
                    </div>
                    <div className="p-3 border border-emerald/30 bg-emerald/10 rounded-lg flex gap-3 items-center">
                       <CheckCircle2 className="w-5 h-5 text-emerald" />
                       <span className="text-xs font-mono">Building geometry valid</span>
                    </div>
                    <div className="p-3 border border-amber-500/30 bg-amber-500/10 rounded-lg flex gap-3 items-center">
                       <AlertTriangle className="w-5 h-5 text-amber-500" />
                       <span className="text-xs font-mono text-amber-200">Building crosses parcel boundary (WARNING)</span>
                    </div>
                    <div className="p-3 border border-rose-500/30 bg-rose-500/10 rounded-lg flex gap-3 items-center">
                       <AlertCircle className="w-5 h-5 text-rose-500" />
                       <span className="text-xs font-mono text-rose-200">Property geometry requires review (REVIEW REQUIRED)</span>
                    </div>
                  </div>
                )}
              </>
            )}
            {simulating && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                  <span className="text-xs font-mono text-purple-300 font-bold tracking-widest uppercase animate-pulse">Running {activeModule} Model...</span>
                </div>
              </div>
            )}
          </div>

          {/* HUMAN IN THE LOOP REVIEW */}
          <div className="p-5 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between">
             <div>
               <h3 className="text-sm font-bold text-white flex items-center gap-2">
                 <Eye className="w-4 h-4 text-cyan-400" /> HUMAN REVIEW REQUIRED
               </h3>
               <p className="text-[10px] text-slate-400 font-mono mt-1 max-w-md">
                 AI predictions do not automatically modify authoritative cadastral records. Review results to promote to staging.
               </p>
             </div>
             
             {reviewState === 'PENDING' && (
               <div className="flex gap-3">
                 <button onClick={handleReject} className="flex items-center gap-2 px-4 py-2 rounded border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-bold font-mono">
                   <X className="w-4 h-4" /> REJECT
                 </button>
                 <button onClick={handleAccept} className="flex items-center gap-2 px-4 py-2 rounded bg-emerald/20 border border-emerald/50 text-emerald hover:bg-emerald/30 transition-colors text-xs font-bold font-mono">
                   <Check className="w-4 h-4" /> ACCEPT
                 </button>
               </div>
             )}
             
             {reviewState === 'ACCEPTED' && (
               <div className="flex items-center gap-2 px-4 py-2 rounded bg-emerald/10 border border-emerald text-emerald text-xs font-bold font-mono">
                 <CheckCircle2 className="w-4 h-4" /> ACCEPTED TO POSTGIS
               </div>
             )}

             {reviewState === 'REJECTED' && (
               <div className="flex items-center gap-2 px-4 py-2 rounded bg-rose-500/10 border border-rose-500 text-rose-400 text-xs font-bold font-mono">
                 <X className="w-4 h-4" /> REJECTED / AUDIT RETAINED
               </div>
             )}
          </div>
        </div>

        {/* Right Sidebar: Recent Jobs */}
        <div className="w-80 glass-strong rounded-2xl border border-cyber/20 p-5 flex flex-col">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4 border-b border-slate-800 pb-2">Recent Processing Jobs</h3>
          <div className="space-y-3 overflow-y-auto">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                onClick={() => setSelectedJobId(job.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                  selectedJobId === job.id ? 'bg-slate-800 border-purple-500/50' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[11px] font-bold text-white truncate pr-2">{job.title}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono whitespace-nowrap">{job.provenanceStatus}</span>
                </div>
                <p className="text-[9px] text-slate-400 font-mono truncate">Type: {job.jobType}</p>
                <p className="text-[9px] text-slate-500 font-mono mt-1">
                  Model: {job.modelName || 'Rule-based'}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-auto pt-4 border-t border-slate-800">
             <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
               <p className="text-[10px] text-amber-500 font-bold font-mono flex items-start gap-2">
                 <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" />
                 AI metrics and confidence scores are simulated for this prototype demonstration.
               </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
