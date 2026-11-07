import React, { useState } from 'react';
import { DOG_ASSETS } from '../data/dogData';
import { Maximize2, Download, ShieldCheck, Box, Sparkles } from 'lucide-react';
import { ArtStyle } from '../types';

interface ViewCard {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  aspect: string;
  tags: string[];
  description: string;
  modelingTips: string[];
}

const CROSSY_VIEW_CARDS: ViewCard[] = [
  {
    id: 'crossy_turnaround',
    title: 'Crossy Road 體素四視圖 (Voxel 4-View Turnaround)',
    subtitle: '前視、左側視、右側視、後視方塊對齊',
    image: DOG_ASSETS.crossyTurnaround,
    aspect: '16:9',
    tags: ['體素方塊', '純黑狗身', '亮紅項圈', '金黃扣環', 'Q版垂耳'],
    description: '標準天天過馬路 (Crossy Road) 美術風格的四視圖模型藍圖。採用純立方體（Voxel / Cubes）構成，雙耳、項圈、眼瞳、四肢與尾巴均處於水平格點對齊。',
    modelingTips: [
      '所有幾何體均為 Box / Voxel，零倒角（No Bevel），維持純粹的立方邊緣',
      '頸部項圈高度為 1 個體素單元，使用亮紅色（#FF2D2D）與金黃搭扣（#FFD214）',
      '眼部為 2×2 體素眼白搭配中央黑瞳，嘴角帶有 1 格粉紅舌頭方塊',
    ],
  },
  {
    id: 'crossy_gameplay',
    title: '天天過馬路 實機等角透視 (Game Isometric View)',
    subtitle: '公路、鐵道、河流與方塊綠地場景跳躍',
    image: DOG_ASSETS.crossyIsometric,
    aspect: '4:3',
    tags: ['等角投影', '跳躍動態', '草地方塊', '車流路段', 'Crossy風格'],
    description: '黑狗角色置身於標誌性 Crossy Road 遊戲世界中，展示經典的 45 度等角跳躍（Hop）姿態、方塊樹木與明亮飽和的環境光照效果。',
    modelingTips: [
      '相機視角為經典的正等角透視（Orthographic Isometric，俯角約 35.26°）',
      '跳躍時啟用 Squash & Stretch 擠壓拉伸變形（跳起時 Y 軸拉長 112%，落地擠壓 92%）',
      '地面投影為純黑低透明度方形柔和陰影',
    ],
  },
  {
    id: 'crossy_front_side',
    title: '體素正前視與側視特寫 (MagicaVoxel Front & Side)',
    subtitle: '高解析度方塊結構與五官分佈',
    image: DOG_ASSETS.crossyFrontSide,
    aspect: '4:3',
    tags: ['MagicaVoxel', '正側視特寫', '項圈五金', '直立立耳變體'],
    description: '展現高精度的體素立方體拼接細節，直立雙耳與吻部結構清晰，項圈下方懸掛圓形金屬銘牌。',
    modelingTips: [
      '推薦使用 MagicaVoxel 製作，網格尺寸設定為 20×24×28',
      '導出為 .obj 或 .vox 格式後，頂點顏色烘焙到純色調色盤',
      '四肢為獨立方塊父子層級，方便進行 Hop 奔跑擺動骨骼綁定',
    ],
  },
  {
    id: 'crossy_reference',
    title: '用戶上傳 Crossy Road 原版美術參考 (Original Reference)',
    subtitle: '天天過馬路角色庫與世界觀風格對照',
    image: DOG_ASSETS.crossyReference,
    aspect: '1:1',
    tags: ['原版遊戲截圖', '方塊公仔', '像素字體', '比例標準'],
    description: '使用者上傳之天天過馬路 (Crossy Road) 官方遊戲畫面，作為黑犬角色方塊大小、色彩飽和度與幾何風格的權威比對基準。',
    modelingTips: [
      '嚴格遵循 Crossy Road 的極簡純色面片風格，無額外凹凸貼圖',
      '角色比例約為 2-3 頭身，維持萌系趣味感',
      '燈光採用高對比度的直射日光與青草地環境反光',
    ],
  },
];

const REALISTIC_VIEW_CARDS: ViewCard[] = [
  {
    id: 'real_turnaround',
    title: '寫實標準四視圖 (Realistic 4-View Master)',
    subtitle: '短被毛黑犬全身輪廓藍圖',
    image: DOG_ASSETS.turnaroundSheet,
    aspect: '16:9',
    tags: ['前/後/左/右', '肌肉線條', '紅皮革項圈', '對稱基準'],
    description: '標準寫實風格 4 視圖轉面圖，適合高端影視與次世代遊戲 3D 拓撲。',
    modelingTips: [
      '保持左右臉部拓撲點對稱 (Symmetry ON)',
      '雙耳向外微展約 12 度',
      '紅色項圈沿頸部斜向約 35 度環繞',
    ],
  },
  {
    id: 'real_front',
    title: '正前視圖 (Front Orthographic)',
    subtitle: '面部對稱度與項圈正面閉環',
    image: DOG_ASSETS.frontView,
    aspect: '4:3',
    tags: ['雙耳等高', '眼距比例', '項圈正中扣環'],
    description: '嚴格對稱的正面視角，用於校驗頭顱寬度與雙眼間距。',
    modelingTips: ['耳尖垂直線落在肩關節外側內緣', '紅色項圈在頸部呈自然的弧狀下垂'],
  },
  {
    id: 'real_side',
    title: '左側視圖 (Left Profile)',
    subtitle: '全身輪廓線條與體態動態',
    image: DOG_ASSETS.sideView,
    aspect: '4:3',
    tags: ['背脊弧線', '腹線內收', '項圈傾角'],
    description: '展示完整的流線型骨骼與肌肉曲線，從強健胸腔過渡到上提腹線。',
    modelingTips: ['肩胛骨至肘關節成 90-100 度運動夾角', '飛節垂直立於後腳掌正上方'],
  },
  {
    id: 'real_hero',
    title: '3/4 透視寫真視圖 (Three-Quarter Perspective)',
    subtitle: '棚拍光影質感與真實毛皮光澤',
    image: DOG_ASSETS.heroView,
    aspect: '4:3',
    tags: ['曜黑光澤', '紅皮革紋理', '黃銅金屬反光'],
    description: '高品質影棚寫真，精確呈現純黑被毛在高反差邊緣光下的高光過渡。',
    modelingTips: ['毛髮著色器 SSS 偏暖微紅', '皮革粗糙度約 0.35'],
  },
];

interface Props {
  artStyle: ArtStyle;
}

export const ViewportsGrid: React.FC<Props> = ({ artStyle }) => {
  const cards = artStyle === 'crossy_road' ? CROSSY_VIEW_CARDS : REALISTIC_VIEW_CARDS;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Box className="w-4 h-4 text-sky-400" />
            <span>
              {artStyle === 'crossy_road'
                ? 'Crossy Road 體素視角拆解與實機對照'
                : '寫實犬隻多視角拆解與建模要點'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            包含標準 4 視圖轉面圖、實機等角透視、正側視特寫與官方參考風格比對，點擊右上角按鈕可全螢幕檢視。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className="group flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all shadow-lg"
          >
            {/* Image Preview Container */}
            <div className="relative aspect-[4/3] bg-neutral-950 overflow-hidden flex items-center justify-center">
              <img
                src={card.image}
                alt={card.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
                <span className="bg-slate-950/85 text-slate-200 text-[11px] font-mono px-2 py-0.5 rounded backdrop-blur-md border border-slate-800">
                  {card.aspect}
                </span>
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setSelectedImage(card.image)}
                  className="p-1.5 bg-slate-950/85 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 backdrop-blur-sm transition"
                  title="全螢幕檢視"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <a
                  href={card.image}
                  download={`${card.id}.jpg`}
                  className="p-1.5 bg-slate-950/85 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 backdrop-blur-sm transition"
                  title="下載圖片"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1 bg-slate-900/90">
              <div className="mb-2">
                <h4 className="text-sm font-semibold text-slate-100">{card.title}</h4>
                <div className="text-xs text-slate-400 mt-0.5">{card.subtitle}</div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {card.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {card.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-3 border-t border-slate-800 bg-slate-950/40 -mx-4 -mb-4 p-4">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3D 體素建模與動畫參考要點</span>
                </div>
                <ul className="space-y-1.5">
                  {card.modelingTips.map((tip, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-sm bg-red-500 mt-1.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img
              src={selectedImage}
              alt="High Resolution Zoom"
              referrerPolicy="no-referrer"
              className="max-h-[82vh] w-auto object-contain rounded-lg shadow-2xl border border-slate-800"
            />
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-300">
              <span>點擊任意處或 ESC 關閉</span>
              <a
                href={selectedImage}
                download="crossy_road_image.jpg"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-medium shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>儲存高解析度原圖</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
