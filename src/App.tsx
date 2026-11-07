/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Gamepad2,
  Layers,
  RotateCw,
  LayoutGrid,
  FileText,
  Download,
  Share2,
  Check,
  Box,
  Dog,
  ShieldAlert,
  ShieldCheck,
  Coins,
  Timer,
} from 'lucide-react';
import { ActiveTab, ArtStyle } from './types';
import {
  DOG_ASSETS,
  CROSSY_ANATOMICAL_FEATURES,
  ANATOMICAL_FEATURES,
} from './data/dogData';
import { CrossyRoadGame } from './components/CrossyRoadGame';
import { TurnaroundCanvas } from './components/TurnaroundCanvas';
import { DogTurntable3D } from './components/DogTurntable3D';
import { ViewportsGrid } from './components/ViewportsGrid';
import { CharacterSpecSheet } from './components/CharacterSpecSheet';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('game');
  const [artStyle, setArtStyle] = useState<ArtStyle>('crossy_road');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const features = artStyle === 'crossy_road' ? CROSSY_ANATOMICAL_FEATURES : ANATOMICAL_FEATURES;
  const activeFeature = features.find((f) => f.id === selectedFeatureId);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const currentDownloadUrl =
    artStyle === 'crossy_road' ? DOG_ASSETS.crossyTurnaround : DOG_ASSETS.turnaroundSheet;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-red-500/30 selection:text-red-200">
      {/* 1. Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand & Project Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-950/60 border border-red-400/40">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>Crossy Road 天天過馬路遊戲</span>
                </h1>
                <span className="hidden sm:inline text-xs text-slate-500">·</span>
                <span className="hidden sm:inline text-xs text-red-400 font-medium">
                  紅綠燈金幣規則版
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>黑犬紅項圈體素主角</span>
                <span aria-hidden="true">·</span>
                <span>紅燈跨越扣 1 金幣並加速 1.1x</span>
                <span aria-hidden="true">·</span>
                <span>同色區域限時 20 秒</span>
              </div>
            </div>
          </div>

          {/* Style Switcher & Export */}
          <div className="flex items-center gap-2">
            {/* Art Style Toggle Button */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => setArtStyle('crossy_road')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  artStyle === 'crossy_road'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="天天過馬路體素風格"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Crossy 體素風</span>
              </button>
              <button
                onClick={() => setArtStyle('realistic')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  artStyle === 'realistic'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="寫實犬隻風格"
              >
                <Dog className="w-3.5 h-3.5" />
                <span>寫實風格</span>
              </button>
            </div>

            <button
              onClick={handleShare}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="分享工作站"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '已複製' : '分享'}</span>
            </button>

            <a
              href={currentDownloadUrl}
              download={artStyle === 'crossy_road' ? 'crossy_dog_4view.jpg' : 'black_dog_4view.jpg'}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">下載四視圖</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Top Navigation Tabs */}
      <div className="border-b border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto" aria-label="工作站面板">
            <button
              onClick={() => setActiveTab('game')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'game'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/40 border border-red-500'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-white" />
              <span>🎮 Crossy Road 實機遊戲</span>
            </button>

            <button
              onClick={() => setActiveTab('turnaround')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'turnaround'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>四視圖藍圖工作台</span>
            </button>

            <button
              onClick={() => setActiveTab('turntable3d')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'turntable3d'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <RotateCw className="w-4 h-4 text-red-400" />
              <span>3D 體素旋轉檢視台</span>
            </button>

            <button
              onClick={() => setActiveTab('views_breakdown')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'views_breakdown'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-amber-400" />
              <span>實機等角與視角拆解</span>
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'specs'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>體素規格與純色盤</span>
            </button>
          </nav>
        </div>
      </div>

      {/* 3. Main Stage Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Style Summary Hero Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-red-600/10 via-transparent to-transparent pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="w-2 h-2 rounded-sm bg-red-500" />
                <span>CROSSY ROAD GAMEPLAY WITH TRAFFIC LIGHTS</span>
                <span aria-hidden="true">·</span>
                <span>VOXEL ROAD CROSSER</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>天天過馬路 (Crossy Road) 實機遊戲 · 紅綠燈機制版</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                操縱戴著亮紅項圈的曜黑體素小狗，穿梭於車水馬龍的道路、河流浮木與鐵路之間。每條公路設有實時變換的立體紅綠燈，遵守交通號誌以保住金幣並締造新高分！
              </p>
            </div>

            {/* Rules Badge Bar */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 text-xs shrink-0">
              <div className="flex items-center gap-2 bg-red-950/60 border border-red-500/40 p-3 rounded-xl backdrop-blur-sm">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <div className="font-bold text-red-300">🔴 紅燈跨越馬路</div>
                  <div className="text-[11px] text-red-400/80 mt-0.5">扣 1 金幣 · 全場車速加快 1.1 倍 ⚡</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300">🟢 綠燈 / 🟡 黃燈跨越</div>
                  <div className="text-[11px] text-emerald-400/80 mt-0.5">安全通行，不扣金幣不加速 ✓</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-500/40 p-3 rounded-xl backdrop-blur-sm">
                <Timer className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-amber-300">⏱️ 同色區域限時 20 秒</div>
                  <div className="text-[11px] text-amber-400/80 mt-0.5">停留同一顏色超時即失敗！</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab 0: Playable Crossy Road Game */}
        {activeTab === 'game' && (
          <section className="space-y-6">
            <CrossyRoadGame />

            {/* Game Rules & Controls Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>金幣與紅燈加速機制 (Traffic Light & Speed Penalty)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  每條馬路右側均有紅綠燈立柱（綠燈 5 秒、黃燈 1.8 秒、紅燈 4 秒）。紅燈亮起時跳入馬路會被<strong>扣除 1 金幣</strong>，且<strong>全場車輛速度累計加快 1.1 倍</strong>！黃燈與綠燈跨越則安全免罰。
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-sky-400" />
                  <span>操作與按鍵 (Controls)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  支援鍵盤 <strong>W / ↑ (前進)</strong>、<strong>A / ← (左)</strong>、<strong>D / → (右)</strong>、<strong>S / ↓ (後退)</strong>。點擊遊戲畫面或使用畫面右下方虛擬按鍵亦可輕鬆操作。
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-red-400" />
                  <span>同色區域限時與危險 (Color Area Timer & Hazards)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong>全新機制：</strong>在同一塊顏色的區域（如草地、馬路、河流、鐵路）待超過 <strong>20 秒</strong>會直接判定遊戲失敗！請持續前進並變換不同顏色的地形以重置倒數。同時避開疾馳車輛與落水危險！
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Tab 1: 4-View Turnaround Canvas */}
        {activeTab === 'turnaround' && (
          <section className="space-y-4">
            <TurnaroundCanvas
              artStyle={artStyle}
              onSelectFeature={(id) => setSelectedFeatureId(id)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-sm bg-sky-400" />
                  <span>水平體素對齊線 (Voxel Alignment)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  耳尖、眼瞳、鮮紅項圈、軀幹頂面與底座接觸線嚴格水平一致，方便在 MagicaVoxel 或 Blender 快速定位體素座標。
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-sm bg-red-400" />
                  <span>紅項圈特徵錨點 (Collar Anchor)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  厚度 1 個體素單元的鮮紅色方塊帶，正面配有亮黃色方塊扣環，是 Crossy Road 風格中鮮明的角色識別符號。
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
                  <span>體素卡尺測量 (Voxel Caliper)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  開啟右上角量測尺，即可在畫布上拉動測量各部位體素格數（如頭部約 8×8 體素，身長約 14 體素）。
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: 3D Turntable with Hop Animation */}
        {activeTab === 'turntable3d' && (
          <section className="space-y-4">
            <DogTurntable3D isVoxelMode={artStyle === 'crossy_road'} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl text-xs space-y-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <Box className="w-4 h-4 text-sky-400" />
                  <span>Crossy Road 體素 3D 控制說明</span>
                </h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li>· 點擊「經典跳躍 (Hop!)」：立即觀看天天過馬路標誌性起跳與落地擠壓（Squash & Stretch）動畫</li>
                  <li>· 滑鼠按住左鍵自由旋轉：360° 旋轉檢視純色方塊受光面與方塊地磚陰影</li>
                  <li>· 快速定錨按鈕：前視（0°）、右側（90°）、後視（180°）、左側（270°）、等角透視（Iso）</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl text-xs space-y-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <Box className="w-4 h-4 text-red-400" />
                  <span>天天過馬路著色器與材質特色</span>
                </h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li>· Flat Shading 無平滑著色：保留純粹立方體邊緣感，無倒角折射</li>
                  <li>· 鮮豔飽和色系：曜石黑體素（#16171A）搭配朱紅項圈（#EE2222）與金黃搭扣（#FFCC00）</li>
                  <li>· 標誌性草地底座：綠色交錯方塊磚與褐色泥土邊緣，還原真實遊戲世界感</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Detailed Viewports Grid */}
        {activeTab === 'views_breakdown' && <ViewportsGrid artStyle={artStyle} />}

        {/* Tab 4: Technical Specifications & Swatches */}
        {activeTab === 'specs' && <CharacterSpecSheet artStyle={artStyle} />}
      </main>

      {/* Feature Callout Modal */}
      {activeFeature && (
        <div
          onClick={() => setSelectedFeatureId(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono text-red-400 uppercase tracking-wider">
                  Crossy Road 體素特徵 Callout
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">{activeFeature.name}</h3>
                <div className="text-xs text-slate-400">{activeFeature.nameEn}</div>
              </div>
              <button
                onClick={() => setSelectedFeatureId(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              {activeFeature.description}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedFeatureId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-red-600" />
            <span>Crossy Road 天天過馬路遊戲 · 紅綠燈金幣規則版</span>
          </div>
          <div className="flex items-center gap-3">
            <span>紅燈跨越扣 1 金幣 · 綠燈與黃燈不扣金幣</span>
            <span aria-hidden="true">·</span>
            <span>黑犬紅項圈 3D 體素主角</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
