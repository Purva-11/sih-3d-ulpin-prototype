import React, { Suspense, useState, useCallback, useMemo } from 'react';
import LegacyBuilding3D, { type BuildingConfig } from './LegacyBuilding3D';
import LegacyControlPanel from './LegacyControlPanel';
import LegacyAdminPanel, { type AdminFormData } from './LegacyAdminPanel';
import { generateULPIN, type ULPINResponse } from './legacyApi';

function LoadingScreen() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="inline-block w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-mono">Initializing 3D Registry Engine...</p>
      </div>
    </div>
  );
}

export default function LegacyDetailedBuilding() {
  // --- AdminPanel State ---
  const [adminData, setAdminData] = useState<AdminFormData | null>(null);

  // --- ControlPanel State ---
  const [stateCode, setStateCode] = useState('MH');
  const [districtCode, setDistrictCode] = useState('NGP');
  const [surveyPlotNo, setSurveyPlotNo] = useState('PLOT-402/A');
  const [floorLevel, setFloorLevel] = useState(4);
  const [flatUnit, setFlatUnit] = useState('Flat 402');

  // --- Building3D State ---
  const [selectedFloor, setSelectedFloor] = useState(3);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);

  // --- Global State ---
  const [ulpinData, setUlpinData] = useState<ULPINResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAdminSubmit = useCallback(async (data: AdminFormData) => {
    setLoading(true);
    setAdminData(data);
    
    // Sync Admin data to ControlPanel where applicable
    setStateCode(data.stateCode || 'MH');
    setDistrictCode(data.districtCode || 'NGP');
    setSurveyPlotNo(data.plotNo || 'PLOT-402/A');
    setFloorLevel(data.selectedFloor || 1);
    setFlatUnit(data.flatNumber || 'Flat 401');
    setSelectedFloor((data.selectedFloor || 1) - 1);
    
    try {
      const response = await generateULPIN({
        latitude: parseFloat(data.latitude) || 21.1458,
        longitude: parseFloat(data.longitude) || 79.0882,
        floorLevel: data.selectedFloor,
        flatUnit: data.flatNumber,
        stateCode: data.stateCode,
        districtCode: data.districtCode,
        surveyPlotNo: data.plotNo,
        ownerName: data.ownerName,
        totalFloors: data.totalFloors,
        taxStatus: data.taxStatus as 'PAID' | 'PENDING'
      });
      setUlpinData(response);
      setFocusTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("ULPIN Generation failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleControlGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await generateULPIN({
        stateCode,
        districtCode,
        surveyPlotNo,
        floorLevel,
        flatUnit,
        ownerName: adminData?.ownerName || 'Rahul Sharma',
        totalFloors: adminData?.totalFloors || 5,
        taxStatus: (adminData?.taxStatus || 'PAID') as 'PAID' | 'PENDING'
      });
      setUlpinData(response);
      setSelectedFloor(floorLevel - 1);
      setFocusTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("ULPIN Generation failed", err);
    } finally {
      setLoading(false);
    }
  }, [stateCode, districtCode, surveyPlotNo, floorLevel, flatUnit, adminData]);

  const handleCopy = useCallback(() => {
    if (ulpinData) {
      navigator.clipboard.writeText(ulpinData.ulpin).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [ulpinData]);

  const buildingConfig: BuildingConfig = useMemo(() => {
    return {
      totalFloors: adminData?.totalFloors || 5,
      floorHeightM: 3.2,
      footprint: null,
      osmLevels: null,
    };
  }, [adminData]);

  return (
    <div className="w-full h-full flex overflow-hidden bg-[#0B1120] text-slate-300 font-sans">
      <LegacyAdminPanel onGenerate3D={handleAdminSubmit} />

      <main className="flex-1 relative h-full">
        <Suspense fallback={<LoadingScreen />}>
          <LegacyBuilding3D 
            config={buildingConfig}
            selectedFloor={selectedFloor}
            hoveredFloor={hoveredFloor}
            onSelectFloor={(idx) => {
              setSelectedFloor(idx);
              setFloorLevel(idx + 1);
            }}
            onHoverFloor={setHoveredFloor}
            focusTrigger={focusTrigger}
            selectedFlat={flatUnit}
            onSelectFlat={setFlatUnit}
          />
        </Suspense>
      </main>

      <LegacyControlPanel
        state={stateCode}
        setState={setStateCode}
        district={districtCode}
        setDistrict={setDistrictCode}
        surveyPlotNo={surveyPlotNo}
        setSurveyPlotNo={setSurveyPlotNo}
        floorLevel={floorLevel}
        setFloorLevel={setFloorLevel}
        flatUnit={flatUnit}
        setFlatUnit={setFlatUnit}
        onGenerate={handleControlGenerate}
        loading={loading}
        result={ulpinData}
        copied={copied}
        onCopy={handleCopy}
      />
    </div>
  );
}
