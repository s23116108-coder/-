import { CharacterColor, OrthographicGuide, AnatomicalFeature } from '../types';

export const DOG_ASSETS = {
  // Crossy Road Voxel Style
  crossyTurnaround: '/src/assets/images/voxel_dog_turnaround_sheet_1793428473379.jpg',
  crossyIsometric: '/src/assets/images/voxel_dog_gameplay_isometric_1793428475949.jpg',
  crossyFrontSide: '/src/assets/images/voxel_dog_ortho_front_side_1793428475660.jpg',
  crossyReference: '/public/assets/aistudio/image_33ac56da.png',

  // Realistic / Concept Art Style
  turnaroundSheet: '/src/assets/images/dog_turnaround_sheet_1793428028052.jpg',
  frontView: '/src/assets/images/dog_front_orthographic_1793428027526.jpg',
  sideView: '/src/assets/images/dog_side_profile_1793428030015.jpg',
  heroView: '/src/assets/images/dog_threequarter_hero_1793428029105.jpg',
};

// Alignment Guides specifically calibrated for Crossy Road Voxel 4-View
export const CROSSY_GUIDES: OrthographicGuide[] = [
  {
    id: 'voxel_ears',
    name: '方塊垂耳頂部 (Ear Block Line)',
    yPercent: 32.5,
    color: '#38bdf8',
    description: '折耳立方體頂點水平對齊，確保四視圖頭部方塊高度一致。',
  },
  {
    id: 'voxel_eyes',
    name: '方塊像素眼位 (Voxel Eye Line)',
    yPercent: 41.5,
    color: '#818cf8',
    description: '白色與黑色方塊眼瞳中心水平基準線。',
  },
  {
    id: 'voxel_collar',
    name: '紅色項圈方塊環 (Red Collar Voxel Ring)',
    yPercent: 53.5,
    color: '#ef4444',
    description: '鮮紅 1-voxel 厚度項圈，前方掛載亮黃色方形金屬搭扣。',
  },
  {
    id: 'voxel_back',
    name: '背部方塊頂面 (Dorsal Spine Level)',
    yPercent: 55.0,
    color: '#10b981',
    description: '軀幹主體長方體上表面，側視與後視維持平行。',
  },
  {
    id: 'voxel_belly',
    name: '軀幹底部邊界 (Torso Underbelly)',
    yPercent: 68.8,
    color: '#f59e0b',
    description: '身體方塊底部與四肢方塊的接合分界線。',
  },
  {
    id: 'voxel_tail',
    name: '翹尾末端高度 (Voxel Tail Tip)',
    yPercent: 47.0,
    color: '#ec4899',
    description: '向後上方傾斜 45 度的梯級像素尾巴末端。',
  },
  {
    id: 'voxel_ground',
    name: '地面網格接觸線 (Floor Grid Contact)',
    yPercent: 78.5,
    color: '#94a3b8',
    description: '方塊腳底平踩於透視網格地板之基準線。',
  },
];

export const INITIAL_GUIDES: OrthographicGuide[] = [
  {
    id: 'ears',
    name: '耳尖定位線 (Ear Tips)',
    yPercent: 12.5,
    color: '#38bdf8',
    description: '雙耳最高點，保持水平一致。',
  },
  {
    id: 'eyes',
    name: '眼瞳水平線 (Eye Line)',
    yPercent: 24.2,
    color: '#818cf8',
    description: '眼眶中心水平對齊。',
  },
  {
    id: 'collar',
    name: '紅色項圈核心線 (Red Collar Anchor)',
    yPercent: 37.8,
    color: '#ef4444',
    description: '鮮紅皮革項圈環繞頸部下緣。',
  },
  {
    id: 'withers',
    name: '肩胛肩高線 (Withers / Shoulder)',
    yPercent: 44.0,
    color: '#f59e0b',
    description: '背部最高隆起點。',
  },
  {
    id: 'backline',
    name: '背脊水準基線 (Dorsal Spine)',
    yPercent: 47.5,
    color: '#10b981',
    description: '背部肌肉流線。',
  },
  {
    id: 'chest',
    name: '胸腔下緣線 (Chest Depth)',
    yPercent: 62.0,
    color: '#06b6d4',
    description: '胸廓底部與前肢肘關節水平齊平。',
  },
  {
    id: 'ground',
    name: '地面接觸基準 (Ground Contact)',
    yPercent: 90.5,
    color: '#94a3b8',
    description: '四肢足爪平踩地面基準線。',
  },
];

export const CROSSY_COLOR_PALETTE: CharacterColor[] = [
  {
    name: '經典體素純黑 (Crossy Voxel Black)',
    hex: '#18191c',
    role: '主體立方體軀幹、頭部、四肢方塊',
    percentage: '76%',
  },
  {
    name: '鮮明亮朱紅 (Crossy Radiant Red Collar)',
    hex: '#ff2d2d',
    role: '頸部高飽和紅色項圈方塊條，Crossy Road 標誌視覺焦點',
    percentage: '8%',
  },
  {
    name: '金黃金屬扣 (Yellow Brass Buckle)',
    hex: '#ffd214',
    role: '項圈前方的立體金色吊牌／方形扣環',
    percentage: '3%',
  },
  {
    name: '大眼純白 (Pixel Eye White)',
    hex: '#ffffff',
    role: '外圈眼白立方體像素，呈現呆萌 Q 版表情',
    percentage: '4%',
  },
  {
    name: '粉嫩舌頭 (Cute Tongue Pink)',
    hex: '#ff94b8',
    role: '嘴邊微露的粉紅小舌方塊',
    percentage: '2%',
  },
  {
    name: '青草綠地基底 (Crossy Grass Green)',
    hex: '#78c800',
    role: '天天過馬路標誌性草地方塊格底座',
    percentage: '7%',
  },
];

export const REALISTIC_COLOR_PALETTE: CharacterColor[] = [
  {
    name: '極致曜石黑 (Obsidian Black Fur)',
    hex: '#141416',
    role: '全身短被毛主色調，深沉有光澤',
    percentage: '78%',
  },
  {
    name: '天鵝絨黑灰 (Velvet Fur Secondary)',
    hex: '#23252b',
    role: '側光漫射與肌肉隆起處柔和過渡',
    percentage: '12%',
  },
  {
    name: '鮮明朱紅 (Crimson Collar)',
    hex: '#dc2626',
    role: '高飽和紅色皮革項圈主色',
    percentage: '5%',
  },
  {
    name: '黃銅五金扣環 (Brass Ring / Hardware)',
    hex: '#d97706',
    role: '項圈前端金屬 O 型吊環',
    percentage: '2%',
  },
  {
    name: '琥珀棕瞳孔 (Amber Eyes)',
    hex: '#b45309',
    role: '雙眸虹膜點綴',
    percentage: '3%',
  },
];

export const CROSSY_ANATOMICAL_FEATURES: AnatomicalFeature[] = [
  {
    id: 'voxel_collar_tag',
    name: '紅色項圈與方形黃金扣',
    nameEn: 'Voxel Red Collar & Gold Buckle',
    xPercent: 13.5,
    yPercent: 54.0,
    description: '由 1×1 體素單元環繞頸部形成的亮紅色項圈，前方掛載 1 個亮黃色體素金屬扣環，與黑毛形成鮮明對比。',
    targetView: 'turnaround',
  },
  {
    id: 'voxel_cute_eyes',
    name: '方塊大眼與吐舌萌點',
    nameEn: 'Boxy Googly Eyes & Tongue',
    xPercent: 13.5,
    yPercent: 43.5,
    description: '白底黑瞳的方形眼球像素，搭配嘴部正中央突出的 1 格粉色舌頭方塊，完美重現 Crossy Road 的幽默逗趣感。',
    targetView: 'turnaround',
  },
  {
    id: 'voxel_chunky_body',
    name: '厚實長方體軀幹',
    nameEn: 'Chunky Voxel Torso',
    xPercent: 36.0,
    yPercent: 62.0,
    description: '乾淨俐落的純黑立方體組合，無任何倒角與平滑過濾，純粹呈現 MagicaVoxel 經典體素硬邊結構。',
    targetView: 'turnaround',
  },
  {
    id: 'voxel_tail_angle',
    name: '45° 階梯翹尾巴',
    nameEn: 'Stepped Upright Tail',
    xPercent: 26.0,
    yPercent: 51.0,
    description: '以三階像素塊向上遞升的短尾巴，跳躍時具有活潑的擺動重心反饋。',
    targetView: 'turnaround',
  },
];

export const CROSSY_TECHNICAL_SPECS = {
  subject: '天天過馬路 (Crossy Road) 體素犬隻角色 (Voxel Canine Hopper)',
  artStyle: 'MagicaVoxel / 3D Cubic Low-Poly / Flat Shaded',
  gridResolution: '16 × 24 × 20 Voxels (主體小於 1000 體素單元)',
  materials: '無紋理貼圖 (Untextured)，純色頂點色 (Vertex Color / Palette Index)',
  accessory: '亮紅色體素項圈 (1-Voxel Height) + 鮮黃方形金屬扣',
  animationStyle: 'Hop & Squash (0.25s 跳躍週期，垂直跳躍時擠壓與拉伸)',
  engineReady: 'Unity / Unreal Engine / Blender (可匯出 .vox / .obj / .gltf)',
};

export const ANATOMICAL_FEATURES: AnatomicalFeature[] = [
  {
    id: 'collar_tag',
    name: '鮮紅真皮項圈 & 金屬環',
    nameEn: 'Vibrant Red Collar & Hardware',
    xPercent: 14.8,
    yPercent: 40.5,
    description: '寬度 2.8cm 厚植鞣皮革，帶有雙道精細車縫線與拋光黃銅圓環。',
    targetView: 'turnaround',
  },
  {
    id: 'head_silhouette',
    name: '流線型頭部與立耳',
    nameEn: 'Alert Cranial & Ear Structure',
    xPercent: 14.8,
    yPercent: 18.0,
    description: '立耳立體，正面對稱感強，側面下顎線條硬朗俐落。',
    targetView: 'turnaround',
  },
  {
    id: 'chest_build',
    name: '深邃運動型胸廓',
    nameEn: 'Athletic Barrel Chest',
    xPercent: 44.5,
    yPercent: 55.0,
    description: '胸深達肘關節，肋骨弧度自然，腹線明顯上提。',
    targetView: 'turnaround',
  },
];

export const TECHNICAL_SPECS = {
  subject: '四足犬科角色模型 (Canine Character Turnaround)',
  coatColor: '純黑短毛 (Glossy Black)',
  accessory: '正紅色皮革項圈 (Crimson Leather Collar, Brass Ring)',
  viewsCount: '4 視圖標準藍圖 (Front, Left Profile, Right Profile, Back)',
  recommendedPolycount: 'Low-Poly 12,000 - 18,000 Tris / High-Res SubD 150,000 Tris',
  textureChannels: 'Albedo, Normal, Roughness, Metallic, AO',
  heightAtWithers: '約 62 cm (標準中大型犬)',
  bodyLength: '約 68 cm',
  headRatio: '頭身比例約 1 : 3.4',
};

