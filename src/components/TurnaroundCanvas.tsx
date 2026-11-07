import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Ruler,
  Layers,
  Plus,
  Trash2,
  Download,
  Info,
  Sparkles,
  Crosshair,
} from 'lucide-react';
import { OrthographicGuide, ViewFilterMode, ArtStyle } from '../types';
import {
  CROSSY_GUIDES,
  INITIAL_GUIDES,
  DOG_ASSETS,
  CROSSY_ANATOMICAL_FEATURES,
  ANATOMICAL_FEATURES,
} from '../data/dogData';

interface Props {
  className?: string;
  artStyle: ArtStyle;
  onSelectFeature?: (id: string) => void;
}

export const TurnaroundCanvas: React.FC<Props> = ({
  className = '',
  artStyle,
  onSelectFeature,
}) => {
  const isVoxel = artStyle === 'crossy_road';
  const defaultGuides = isVoxel ? CROSSY_GUIDES : INITIAL_GUIDES;
  const currentAsset = isVoxel ? DOG_ASSETS.crossyTurnaround : DOG_ASSETS.turnaroundSheet;
  const currentFeatures = isVoxel ? CROSSY_ANATOMICAL_FEATURES : ANATOMICAL_FEATURES;

  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState<OrthographicGuide[]>(defaultGuides);
  const [showGuides, setShowGuides] = useState(true);
  const [filterMode, setFilterMode] = useState<ViewFilterMode>('normal');
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);

  // Sync guides when artStyle changes
  useEffect(() => {
    setGuides(isVoxel ? CROSSY_GUIDES : INITIAL_GUIDES);
  }, [artStyle, isVoxel]);

  // Measurement caliper tool
  const [measureMode, setMeasureMode] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Canvas pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setGuides(defaultGuides);
    setMeasureStart(null);
    setMeasureEnd(null);
  };

  const handleAddGuide = () => {
    const newGuide: OrthographicGuide = {
      id: `custom_${Date.now()}`,
      name: `自訂水平線 #${guides.length + 1}`,
      yPercent: 50,
      color: '#ec4899',
      description: '使用者自訂量測對齊參考線',
    };
    setGuides([...guides, newGuide]);
    setActiveGuideId(newGuide.id);
  };

  const handleDeleteGuide = (id: string) => {
    setGuides(guides.filter((g) => g.id !== id));
    if (activeGuideId === id) setActiveGuideId(null);
  };

  const handleGuideDragStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveGuideId(id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const relativeY = moveEvent.clientY - rect.top;
      const percent = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));

      setGuides((prev) =>
        prev.map((g) => (g.id === id ? { ...g, yPercent: parseFloat(percent.toFixed(1)) } : g))
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (measureMode) {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMeasureStart({ x, y });
      setMeasureEnd({ x, y });
      setIsMeasuring(true);
      return;
    }

    if (e.button === 0) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (measureMode && isMeasuring && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setMeasureEnd({ x, y });
      return;
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsMeasuring(false);
  };

  const getMeasurementInfo = () => {
    if (!measureStart || !measureEnd) return null;
    const dx = measureEnd.x - measureStart.x;
    const dy = measureEnd.y - measureStart.y;
    const distPercent = Math.sqrt(dx * dx + dy * dy);
    const estimatedVoxels = (distPercent * 0.32).toFixed(1);
    return {
      percent: distPercent.toFixed(1),
      voxels: estimatedVoxels,
    };
  };

  const measureInfo = getMeasurementInfo();

  const getFilterStyle = (): React.CSSProperties => {
    switch (filterMode) {
      case 'silhouette':
        return { filter: 'contrast(300%) grayscale(100%) brightness(30%)' };
      case 'blueprint':
        return { filter: 'invert(90%) sepia(100%) hue-rotate(185deg) saturate(350%) contrast(120%)' };
      case 'high_contrast':
        return { filter: 'contrast(170%) saturate(150%)' };
      default:
        return {};
    }
  };

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/90 border-b border-slate-800 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-semibold text-slate-100">
              {isVoxel ? 'Crossy Road 體素四視圖藍圖' : '寫實犬隻四視圖藍圖'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>前視 FRONT</span>
            <span>·</span>
            <span>左側視 LEFT</span>
            <span>·</span>
            <span>右側視 RIGHT</span>
            <span>·</span>
            <span>後視 BACK</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              className="p-1 text-slate-400 hover:text-slate-100 rounded"
              title="縮小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-300 w-11 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.6, z + 0.2))}
              className="p-1 text-slate-400 hover:text-slate-100 rounded"
              title="放大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-1 text-slate-400 hover:text-slate-100 rounded"
              title="重設視圖"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Guides */}
          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              showGuides
                ? 'bg-sky-950/70 border-sky-600 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="開關水平對齊輔助線"
          >
            {showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>對齊線</span>
          </button>

          {/* Measure Caliper Tool */}
          <button
            onClick={() => {
              setMeasureMode(!measureMode);
              if (measureMode) {
                setMeasureStart(null);
                setMeasureEnd(null);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              measureMode
                ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="體素卡尺：在畫布上按住滑鼠拖曳測量體素單元"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>體素量測尺</span>
          </button>

          {/* Filter Modes */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setFilterMode('normal')}
              className={`px-2 py-1 text-xs rounded transition ${
                filterMode === 'normal' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              原色
            </button>
            <button
              onClick={() => setFilterMode('blueprint')}
              className={`px-2 py-1 text-xs rounded transition ${
                filterMode === 'blueprint' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              藍圖
            </button>
            <button
              onClick={() => setFilterMode('silhouette')}
              className={`px-2 py-1 text-xs rounded transition ${
                filterMode === 'silhouette' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              剪影
            </button>
          </div>

          {/* Direct Download Button */}
          <a
            href={currentAsset}
            download="crossy_road_dog_4view_turnaround.jpg"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            title="下載高解析度原圖"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">下載原圖</span>
          </a>
        </div>
      </div>

      {/* Viewport Orthographic Headers (Front, Left, Right, Back) */}
      <div className="grid grid-cols-4 bg-slate-950 text-center py-2 px-3 border-b border-slate-800/80 text-xs font-mono tracking-wider text-slate-400 select-none">
        <div className="flex items-center justify-center gap-1.5 border-r border-slate-800">
          <span className="w-2 h-2 rounded-sm bg-sky-400" />
          <span className="font-semibold text-slate-200">FRONT VIEW (前視)</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 border-r border-slate-800">
          <span className="w-2 h-2 rounded-sm bg-emerald-400" />
          <span className="font-semibold text-slate-200">LEFT SIDE (左側視)</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 border-r border-slate-800">
          <span className="w-2 h-2 rounded-sm bg-amber-400" />
          <span className="font-semibold text-slate-200">RIGHT SIDE (右側視)</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-purple-400" />
          <span className="font-semibold text-slate-200">BACK VIEW (後視)</span>
        </div>
      </div>

      {/* Master Viewport Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative w-full h-[540px] sm:h-[620px] bg-slate-950 overflow-hidden select-none ${
          measureMode ? 'cursor-crosshair' : zoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Voxel Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Scalable and Pannable Image Container */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="relative inline-block max-w-[96%] max-h-[96%] shadow-2xl">
            {/* The Generated Crossy Road Turnaround Image */}
            <img
              ref={imageRef}
              src={currentAsset}
              alt="Crossy Road Voxel 4-View Turnaround"
              referrerPolicy="no-referrer"
              className="max-h-[500px] sm:max-h-[580px] w-auto object-contain rounded-md block pointer-events-none"
              style={getFilterStyle()}
              draggable={false}
            />

            {/* Draggable Horizontal Alignment Guides */}
            {showGuides &&
              guides.map((guide) => (
                <div
                  key={guide.id}
                  style={{ top: `${guide.yPercent}%` }}
                  className="absolute left-0 right-0 group z-10 pointer-events-auto"
                >
                  <div
                    style={{ backgroundColor: guide.color }}
                    className="w-full h-[1.5px] opacity-80 group-hover:h-[2.5px] group-hover:opacity-100 transition-all shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                  />

                  {/* Left drag handle and label */}
                  <div
                    onMouseDown={(e) => handleGuideDragStart(e, guide.id)}
                    style={{ borderColor: guide.color }}
                    className="absolute -top-3 left-2 px-2 py-0.5 bg-slate-950/95 text-[10px] font-mono text-slate-200 border rounded cursor-ns-resize backdrop-blur-sm flex items-center gap-1.5 shadow-md hover:bg-slate-900 transition select-none"
                  >
                    <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: guide.color }} />
                    <span>{guide.name}</span>
                    <span className="text-slate-400">({guide.yPercent}%)</span>
                  </div>

                  {guide.id.startsWith('custom_') && (
                    <button
                      onClick={() => handleDeleteGuide(guide.id)}
                      className="absolute -top-2.5 right-2 p-1 bg-red-950/90 border border-red-500/80 text-red-300 rounded hover:bg-red-900 text-[10px]"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

            {/* Interactive Feature Callout Pins */}
            {currentFeatures.map((feat) => (
              <button
                key={feat.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFeature?.(feat.id);
                }}
                style={{ left: `${feat.xPercent}%`, top: `${feat.yPercent}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none"
                title={`${feat.name}: 點擊查看細節`}
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-5 h-5 rounded-sm bg-red-500/30 animate-ping" />
                  <span className="w-3.5 h-3.5 rounded-sm bg-red-600 border border-white shadow-lg flex items-center justify-center text-[8px] font-bold text-white group-hover:scale-125 transition-transform" />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/95 border border-slate-700 text-slate-100 text-xs px-2.5 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none z-30">
                    <div className="font-semibold text-red-400">{feat.name}</div>
                    <div className="text-[10px] text-slate-300 max-w-xs">{feat.description}</div>
                  </div>
                </div>
              </button>
            ))}

            {/* Measurement Caliper Graphic */}
            {measureStart && measureEnd && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
                <line
                  x1={`${measureStart.x}%`}
                  y1={`${measureStart.y}%`}
                  x2={`${measureEnd.x}%`}
                  y2={`${measureEnd.y}%`}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                {measureInfo && (
                  <g
                    transform={`translate(${((measureStart.x + measureEnd.x) / 2) * 5.4}, ${
                      ((measureStart.y + measureEnd.y) / 2) * 5.4 - 12
                    })`}
                  >
                    <rect
                      x="-45"
                      y="-12"
                      width="90"
                      height="22"
                      rx="4"
                      fill="#0f172a"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="3"
                      fill="#fef3c7"
                      fontSize="11"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      ~{measureInfo.voxels} Voxels
                    </text>
                  </g>
                )}
              </svg>
            )}
          </div>
        </div>

        {/* Live Measurement HUD */}
        {measureMode && (
          <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-amber-500/60 rounded-lg p-2.5 text-xs font-mono backdrop-blur-md z-20 text-slate-200 shadow-xl max-w-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
              <Crosshair className="w-3.5 h-3.5" />
              <span>體素卡尺量測中 (Voxel Caliper)</span>
            </div>
            {measureInfo ? (
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800 flex justify-between gap-3 text-amber-300">
                <span>估計體素: <strong>{measureInfo.voxels} 格</strong></span>
                <span>跨幅: <strong>{measureInfo.percent}%</strong></span>
              </div>
            ) : (
              <span className="text-slate-500">在畫布上拖曳量測方塊間距...</span>
            )}
          </div>
        )}

        {/* Helper Banner */}
        <div className="absolute top-4 right-4 bg-slate-950/80 border border-slate-800 text-slate-300 text-[11px] px-3 py-1.5 rounded-lg backdrop-blur-md pointer-events-none hidden md:flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Crossy Road 體素風格 · 雙耳、眼睛、紅項圈、四肢水平對齊線可上下調整</span>
        </div>
      </div>

      {/* Guide Management Sub-panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-medium text-slate-300">體素水平基準線:</span>
          <span>共 {guides.length} 條參考線</span>
          <button
            onClick={handleAddGuide}
            className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded border border-slate-700 transition"
          >
            <Plus className="w-3 h-3" />
            <span>新增自訂線</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span>鮮紅體素項圈 (Voxel Red Collar)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" />
            <span>黃金金屬扣 (Yellow Buckle)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-600" />
            <span>曜黑體素方塊 (Black Voxels)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
