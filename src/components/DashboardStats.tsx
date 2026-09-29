import { MapPin, Building, Layers, Boxes, ShieldAlert, Cpu, Database } from 'lucide-react';

interface DashboardStatsProps {
  parcelsCount: number;
  buildingsCount: number;
  floorsCount: number;
  propertiesCount: number;
  undergroundCount: number;
  validationWarningsCount: number;
  aiJobsCount: number;
}

export default function DashboardStats({
  parcelsCount,
  buildingsCount,
  floorsCount,
  propertiesCount,
  undergroundCount,
  validationWarningsCount,
  aiJobsCount,
}: DashboardStatsProps) {
  const statItems = [
    { label: 'Parcels', count: parcelsCount, icon: MapPin, color: 'text-emerald', badge: 'POSTGIS' },
    { label: 'Buildings', count: buildingsCount, icon: Building, color: 'text-cyan-400', badge: 'POSTGIS' },
    { label: 'Floors', count: floorsCount, icon: Layers, color: 'text-blue-400', badge: 'POSTGIS' },
    { label: '3D Properties', count: propertiesCount, icon: Boxes, color: 'text-emerald', badge: 'POSTGIS' },
    { label: 'Underground Assets', count: undergroundCount, icon: Database, color: 'text-amber-400', badge: 'POSTGIS' },
    { label: 'Validation Warnings', count: validationWarningsCount, icon: ShieldAlert, color: 'text-rose-400', badge: '1 ISSUE' },
    { label: 'AI Processing Jobs', count: aiJobsCount, icon: Cpu, color: 'text-purple-400', badge: '4 READY' },
  ];

  return (
    <div className="bg-slate-900/90 border-b border-cyber/15 px-6 py-2 z-40 overflow-x-auto">
      <div className="flex items-center gap-4 min-w-max justify-between">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg glass border border-slate-700/50 hover:border-emerald/40 transition-all cursor-default"
            >
              <div className={`p-1.5 rounded-md bg-slate-950/60 ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-mono font-bold text-white leading-none">{item.count}</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
