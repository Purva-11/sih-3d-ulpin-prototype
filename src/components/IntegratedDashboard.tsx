import React, { useState } from 'react';
import { ViewMode, ValidationSummary, ValidationIssue, AIJobResult, DataSourceInfo, PropertyVolume } from '../types/cadastral';
import { 
  Activity, 
  MapPin, 
  Building, 
  Layers, 
  Boxes, 
  ShieldAlert, 
  Cpu, 
  Database,
  ArrowRight,
  Server,
  HardDrive,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  Map,
  Play
} from 'lucide-react';
import { runValidationAPI } from '../services/cadastralService';

interface IntegratedDashboardProps {
  dbStats: any;
  validationSummary: ValidationSummary | null;
  issues: ValidationIssue[];
  aiJobs: AIJobResult[];
  dataSources: DataSourceInfo[];
  healthStatus: any;
  onNavigate: (view: ViewMode) => void;
  selectedParcelId: string | null;
  selectedBuildingId: string | null;
  selectedFloorNumber: number | null;
  selectedProperty: PropertyVolume | null;
  onResetContext: () => void;
}

export default function IntegratedDashboard({
  dbStats,
  validationSummary,
  issues,
  aiJobs,
  dataSources,
  healthStatus,
  onNavigate,
  selectedParcelId,
  selectedBuildingId,
  selectedFloorNumber,
  selectedProperty,
  onResetContext
}: IntegratedDashboardProps) {

  const [validating, setValidating] = useState(false);
  const [valSummaryState, setValSummaryState] = useState(validationSummary);

  const handleRunValidation = async () => {
    setValidating(true);
    try {
      const result = await runValidationAPI();
      setValSummaryState(result.summary);
      // NOTE: Normally we would update the top level state, but this demonstrates it working
    } catch (e) {
      console.error(e);
    } finally {
      setValidating(false);
    }
  };

  const getSystemStatus = (h: any) => {
    if (!h) return { status: 'LOADING', color: 'text-slate-400' };
    if (h.status === 'ok') return { status: 'ONLINE', color: 'text-emerald' };
    return { status: 'ERROR', color: 'text-rose-400' };
  };

  const dbStatus = getSystemStatus(healthStatus);
  const activeIssues = issues.filter(i => i.status !== 'PASSED' && i.status !== 'NOT_CHECKED');
  
  // Fake context calculation to not crash if null
  const hasContext = !!selectedParcelId;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <Activity className="text-emerald" /> 
            BHOOMI-3D SYSTEM DASHBOARD
          </h1>
          <p className="text-sm text-slate-400 font-mono mt-1">SIH26011 Stage 2 Screening Prototype — End-to-End Workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs font-mono text-amber-400">
            PROTOTYPE / DEMO DATA
          </div>
        </div>
      </div>

      {/* Workflow Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-bold font-mono text-slate-300 uppercase mb-4">Integrated Workflow</h2>
        <div className="flex flex-wrap items-center gap-2 lg:gap-4">
          <WorkflowStep label="01 DATA INGESTION" status="AVAILABLE" icon={Database} onClick={() => onNavigate('data_sources')} />
          <ArrowRight className="text-slate-600 w-4 h-4 hidden lg:block" />
          <WorkflowStep label="02 2D CADASTRAL" status="AVAILABLE" icon={Map} onClick={() => onNavigate('2d_cadastral')} />
          <ArrowRight className="text-slate-600 w-4 h-4 hidden lg:block" />
          <WorkflowStep label="03 3D SATELLITE" status="AVAILABLE" icon={Globe} onClick={() => onNavigate('3d_satellite')} />
          <ArrowRight className="text-slate-600 w-4 h-4 hidden lg:block" />
          <WorkflowStep label="04 3D LOCALITY" status="AVAILABLE" icon={Building} onClick={() => onNavigate('3d_locality')} />
          <ArrowRight className="text-slate-600 w-4 h-4 hidden lg:block" />
          <WorkflowStep label="05 DETAILED 3D" status="AVAILABLE" icon={Layers} onClick={() => onNavigate('3d_scene')} />
          <ArrowRight className="text-slate-600 w-4 h-4 hidden lg:block" />
          <WorkflowStep label="06 AI / ML" status="DEMO" icon={Cpu} onClick={() => onNavigate('ai_processing')} />
          <ArrowRight className="text-slate-600 w-4 h-4 hidden lg:block" />
          <WorkflowStep label="07 VALIDATION" status="AVAILABLE" icon={ShieldAlert} onClick={() => onNavigate('spatial_validation')} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold font-mono text-slate-300 uppercase mb-4">System Status</h2>
            <div className="space-y-3">
              <HealthRow label="API Gateway" status={dbStatus.status} color={dbStatus.color} />
              <HealthRow label="Database Engine" status={dbStatus.status} color={dbStatus.color} />
              <HealthRow label="PostGIS Extension" status={dbStatus.status} color={dbStatus.color} />
              <HealthRow label="AI/ML Engine" status="DEMO" color="text-amber-400" />
            </div>
          </div>

          {/* Data Statistics */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold font-mono text-slate-300 uppercase mb-4">Cadastral Database</h2>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Parcels" value={dbStats?.parcels_count || 'N/A'} icon={MapPin} />
              <StatCard label="Buildings" value={dbStats?.buildings_count || 'N/A'} icon={Building} />
              <StatCard label="Floors" value={dbStats?.floors_count || 'N/A'} icon={Layers} />
              <StatCard label="Properties" value={dbStats?.properties_count || 'N/A'} icon={Boxes} />
            </div>
          </div>
          
          {/* Government Interoperability */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 blur-xl rounded-full pointer-events-none" />
            <h2 className="text-sm font-bold font-mono text-slate-300 uppercase mb-2">Gov Data Interoperability</h2>
            <div className="space-y-3 mt-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-mono">Current Prototype</p>
                <p className="text-sm font-medium text-amber-400">DEMO / SYNTHETIC DATA</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-mono">Integration Architecture</p>
                <p className="text-sm font-medium text-emerald">READY FOR AUTHORIZED DATA EXCHANGE</p>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Designed to consume official ULPINs, RoR attributes, and authoritative parcel geometry via secure GIS APIs.
              </p>
            </div>
          </div>
        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          
          {/* Active Context / Journey */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold font-mono text-slate-300 uppercase">Current Context</h2>
              <button onClick={onResetContext} className="text-[10px] uppercase font-mono text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded">Reset Demo Context</button>
            </div>
            
            {hasContext ? (
              <div className="space-y-4">
                <ContextRow label="Selected Parcel" value={selectedParcelId!} onNav={() => onNavigate('2d_cadastral')} />
                <ContextRow label="Selected Building" value={selectedBuildingId!} onNav={() => onNavigate('3d_locality')} />
                <ContextRow label="Selected Floor" value={selectedFloorNumber ? `Floor ${selectedFloorNumber}` : 'None'} onNav={() => onNavigate('3d_scene')} />
                
                {selectedProperty && (
                  <div className="mt-4 p-4 border border-emerald/20 bg-emerald/5 rounded-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald" />
                    <h3 className="text-[10px] font-mono text-emerald mb-1">PROTOTYPE 3D PROPERTY ID</h3>
                    <p className="text-lg font-bold font-mono text-white">{selectedProperty.id}</p>
                    <div className="mt-2 text-xs text-slate-400">
                      Official ULPIN: <span className="text-slate-500">NOT SUPPLIED</span>
                    </div>
                    <button 
                      onClick={() => onNavigate('3d_scene')}
                      className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded flex items-center justify-center gap-2 transition-colors"
                    >
                      OPEN DETAILED 3D VIEW <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">No context selected. Start from 2D Cadastral.</div>
            )}
          </div>
          
          {/* AI/ML */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold font-mono text-slate-300 uppercase">AI/ML Processing</h2>
              <button onClick={() => onNavigate('ai_processing')} className="text-xs text-cyber hover:text-white transition-colors">View Lab →</button>
            </div>
            <div className="space-y-2">
              {aiJobs.slice(0,3).map(job => (
                <div key={job.id} className="flex justify-between items-center p-2 rounded bg-slate-950/50 border border-slate-800">
                  <span className="text-xs text-slate-300">{job.capability}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${job.status.includes('DEMO') ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald/10 text-emerald'}`}>
                    {job.status}
                  </span>
                </div>
              ))}
              {aiJobs.length === 0 && <p className="text-xs text-slate-500 text-center py-2">No AI jobs found</p>}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Spatial Validation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-full">
            <h2 className="text-sm font-bold font-mono text-slate-300 uppercase mb-4">Spatial Intelligence</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                <p className="text-2xl font-bold font-mono text-white">{valSummaryState ? valSummaryState.totalChecks : 'N/A'}</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">Total Checks</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                <p className="text-2xl font-bold font-mono text-rose-400">{valSummaryState ? (valSummaryState.errors + valSummaryState.critical) : 'N/A'}</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">Issues Found</p>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-xs font-bold text-slate-400 mb-2">Recent Validation Issues</h3>
              <div className="space-y-2">
                {activeIssues.length > 0 ? (
                  activeIssues.slice(0,3).map(issue => (
                    <div key={issue.id} className="p-2 border border-slate-700/50 bg-slate-800/30 rounded flex items-start gap-2">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${issue.severity === 'WARNING' ? 'text-amber-400' : 'text-rose-400'}`} />
                      <div>
                        <p className="text-xs font-bold text-slate-200">{issue.ruleId}</p>
                        <p className="text-[10px] text-slate-400 truncate">{issue.entityType} {issue.entityId}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-lg">
                    <CheckCircle className="w-6 h-6 mb-2 text-emerald/50" />
                    <p className="text-xs">No active spatial validation issues</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button 
                onClick={handleRunValidation}
                disabled={validating}
                className="w-full py-2 bg-emerald hover:bg-emerald/90 text-slate-950 font-bold font-mono text-sm rounded transition-colors flex items-center justify-center gap-2"
              >
                {validating ? <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" /> : <Play className="w-4 h-4" />}
                {validating ? 'RUNNING VALIDATION...' : 'RUN SPATIAL VALIDATION'}
              </button>
              <button 
                onClick={() => onNavigate('spatial_validation')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs rounded transition-colors"
              >
                VIEW ISSUES ({valSummaryState?.requiresReview || 0} REVIEWS)
              </button>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}

// Subcomponents

function WorkflowStep({ label, status, icon: Icon, onClick }: { label: string, status: string, icon: any, onClick: () => void }) {
  const isAvailable = status === 'AVAILABLE' || status === 'COMPLETED';
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-lg transition-all text-left">
      <div className={`p-1.5 rounded bg-slate-950 ${isAvailable ? 'text-cyan-400' : 'text-slate-500'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-bold font-mono text-slate-300 leading-tight">{label}</p>
        <p className={`text-[9px] font-mono leading-tight ${isAvailable ? 'text-emerald' : 'text-amber-500'}`}>{status}</p>
      </div>
    </button>
  );
}

function HealthRow({ label, status, color }: { label: string, status: string, color: string }) {
  return (
    <div className="flex justify-between items-center pb-2 border-b border-slate-800 last:border-0 last:pb-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-[10px] font-bold font-mono flex items-center gap-1.5 ${color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
        {status}
      </span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string, value: string | number, icon: any }) {
  return (
    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
      <Icon className="w-4 h-4 text-slate-500 mb-2" />
      <p className="text-xl font-bold font-mono text-white leading-none mb-1">{value}</p>
      <p className="text-[10px] text-slate-500 uppercase">{label}</p>
    </div>
  );
}

function ContextRow({ label, value, onNav }: { label: string, value: string, onNav: () => void }) {
  return (
    <div className="flex justify-between items-center group">
      <div>
        <p className="text-[10px] text-slate-500 uppercase">{label}</p>
        <p className="text-sm font-medium text-slate-200">{value}</p>
      </div>
      <button onClick={onNav} className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
        VIEW →
      </button>
    </div>
  );
}
