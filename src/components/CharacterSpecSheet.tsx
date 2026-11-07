import React, { useState } from 'react';
import {
  CROSSY_COLOR_PALETTE,
  REALISTIC_COLOR_PALETTE,
  CROSSY_TECHNICAL_SPECS,
  TECHNICAL_SPECS,
} from '../data/dogData';
import { Copy, Check, FileDown, Palette, Cpu, BookOpen, Box } from 'lucide-react';
import { ArtStyle } from '../types';

interface Props {
  artStyle: ArtStyle;
}

export const CharacterSpecSheet: React.FC<Props> = ({ artStyle }) => {
  const isVoxel = artStyle === 'crossy_road';
  const palette = isVoxel ? CROSSY_COLOR_PALETTE : REALISTIC_COLOR_PALETTE;
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const crossyPromptEN = `Crossy Road video game art style, 4-view orthographic turnaround character model sheet of a cute black dog wearing a bright red collar with a golden yellow voxel buckle. Voxel 3D art, blocky cubic character design, MagicaVoxel aesthetic. Aligned horizontally showing 4 orthographic views: Front View, Left Side View, Right Side View, and Back View. Clean light mint-cyan studio background with subtle floor grid lines. Pure voxel geometry made of sharp rectangular blocks, flat matte pastel shading with clean directional lighting, iconic Crossy Road mobile game character model.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(crossyPromptEN);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownloadJSON = () => {
    const data = {
      characterName: isVoxel ? '天天過馬路黑犬 (Crossy Road Voxel Dog)' : '曜石黑犬 (Realistic Canine)',
      artStyle: isVoxel ? 'Crossy Road Voxel / MagicaVoxel' : 'Realistic 3D Character',
      accessory: '亮紅體素項圈配金黃扣環 (Red Voxel Collar + Gold Buckle)',
      colorPalette: palette,
      specifications: isVoxel ? CROSSY_TECHNICAL_SPECS : TECHNICAL_SPECS,
      masterPrompt: crossyPromptEN,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isVoxel ? 'crossy_road_voxel_dog_specs.json' : 'black_dog_character_specs.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 1. Color Palette Swatches */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-slate-100">
              {isVoxel ? 'Crossy Road 體素純色色盤 (Voxel Palette)' : '角色配色基準盤 (PBR Material Swatches)'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">點擊色塊即可複製 HEX 頂點色碼</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {palette.map((color) => {
            const isCopied = copiedHex === color.hex;
            return (
              <button
                key={color.hex}
                onClick={() => handleCopyHex(color.hex)}
                className="group flex flex-col items-start p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition text-left relative overflow-hidden"
              >
                <div
                  className="w-full h-12 rounded-sm mb-2 shadow-inner border border-white/10 relative"
                  style={{ backgroundColor: color.hex }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-sm">
                    {isCopied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-mono font-bold text-slate-200 flex items-center justify-between w-full">
                  <span>{color.hex}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{color.percentage}</span>
                </div>
                <div className="text-xs font-medium text-slate-100 mt-1 line-clamp-1">{color.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                  {color.role}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Technical Specs & Modeling Geometry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              {isVoxel ? '體素幾何與動畫規範 (Voxel Rigging Standards)' : '3D 拓撲規範 (Topology & Mesh)'}
            </h3>
          </div>

          {isVoxel ? (
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <dt className="text-slate-400">風格流派</dt>
                <dd className="text-slate-200 font-medium">{CROSSY_TECHNICAL_SPECS.artStyle}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <dt className="text-slate-400">體素網格解析度</dt>
                <dd className="text-sky-400 font-mono font-medium">{CROSSY_TECHNICAL_SPECS.gridResolution}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <dt className="text-slate-400">招牌特徵配件</dt>
                <dd className="text-red-400 font-medium">{CROSSY_TECHNICAL_SPECS.accessory}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <dt className="text-slate-400">貼圖與頂點色</dt>
                <dd className="text-slate-200">{CROSSY_TECHNICAL_SPECS.materials}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <dt className="text-slate-400">動畫特徵</dt>
                <dd className="text-emerald-400 font-medium">{CROSSY_TECHNICAL_SPECS.animationStyle}</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-slate-400">支援遊戲引擎</dt>
                <dd className="text-slate-200 font-medium">{CROSSY_TECHNICAL_SPECS.engineReady}</dd>
              </div>
            </dl>
          ) : (
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <dt className="text-slate-400">主體角色</dt>
                <dd className="text-slate-200 font-medium">{TECHNICAL_SPECS.subject}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <dt className="text-slate-400">配件項圈</dt>
                <dd className="text-red-400 font-medium">{TECHNICAL_SPECS.accessory}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <dt className="text-slate-400">面數規範</dt>
                <dd className="text-slate-200 font-mono">{TECHNICAL_SPECS.recommendedPolycount}</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-slate-400">標準肩高</dt>
                <dd className="text-slate-200">{TECHNICAL_SPECS.heightAtWithers}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* 3. Export Prompt & Pipeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Crossy Road 提示詞導出 (Prompt & Pipeline)
                </h3>
              </div>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700 transition"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? '已複製' : '複製 Prompt'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-2">
              可用於 MagicaVoxel 構想、Stable Diffusion / Midjourney 生成額外造型配件或動畫幀：
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed select-all max-h-36 overflow-y-auto">
              {crossyPromptEN}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">體素規格表 (JSON Format)</span>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition shadow-md shadow-red-950/40"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>匯出體素角色規格 (.JSON)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
