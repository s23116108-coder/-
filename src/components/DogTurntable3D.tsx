import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCw, Compass, Play, Pause, ArrowUp, Sparkles, Layers, Box } from 'lucide-react';

interface Props {
  className?: string;
  isVoxelMode?: boolean;
}

export const DogTurntable3D: React.FC<Props> = ({ className = '', isVoxelMode = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [isHopping, setIsHopping] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const [currentAngleDeg, setCurrentAngleDeg] = useState(0);
  const [renderMode, setRenderMode] = useState<'shaded' | 'wireframe' | 'silhouette'>('shaded');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const dogGroupRef = useRef<THREE.Group | null>(null);
  const materialsRef = useRef<THREE.Material[]>([]);
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const animFrameIdRef = useRef<number | null>(null);
  const hopTimeRef = useRef(0);

  const isHoppingRef = useRef(isHopping);
  isHoppingRef.current = isHopping;
  const isRotatingRef = useRef(isRotating);
  isRotatingRef.current = isRotating;
  const rotationSpeedRef = useRef(rotationSpeed);
  rotationSpeedRef.current = rotationSpeed;

  // Build the scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaae7f7); // Crossy road sky blue
    sceneRef.current = scene;

    // 2. Camera setup - Isometric perspective angle
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(3.2, 2.8, 3.8);
    camera.lookAt(0, 0.8, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Directional Crossy Road Sunlight
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x88cc88, 0.7);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbe8, 1.8);
    sunLight.position.set(4, 6, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 15;
    sunLight.shadow.camera.left = -3;
    sunLight.shadow.camera.right = 3;
    sunLight.shadow.camera.top = 3;
    sunLight.shadow.camera.bottom = -3;
    scene.add(sunLight);

    // 5. Crossy Road Grass Platform Block
    const platformGroup = new THREE.Group();

    // Grass top
    const grassGeo = new THREE.BoxGeometry(3.2, 0.4, 3.2);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x76c800, // Vibrant Crossy green
      roughness: 0.6,
      metalness: 0.05,
      flatShading: true,
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = -0.2;
    grass.receiveShadow = true;
    platformGroup.add(grass);

    // Subtle checkered grass tiles
    const tileGeo = new THREE.BoxGeometry(0.8, 0.01, 0.8);
    const tileMat = new THREE.MeshStandardMaterial({
      color: 0x6bb800,
      roughness: 0.6,
      flatShading: true,
    });
    for (let x = -1.2; x <= 1.2; x += 0.8) {
      for (let z = -1.2; z <= 1.2; z += 0.8) {
        if ((Math.round((x + 1.2) / 0.8) + Math.round((z + 1.2) / 0.8)) % 2 === 1) {
          const tile = new THREE.Mesh(tileGeo, tileMat);
          tile.position.set(x, 0.005, z);
          tile.receiveShadow = true;
          platformGroup.add(tile);
        }
      }
    }

    // Dirt base under grass
    const dirtGeo = new THREE.BoxGeometry(3.18, 0.6, 3.18);
    const dirtMat = new THREE.MeshStandardMaterial({
      color: 0x784824,
      roughness: 0.8,
      flatShading: true,
    });
    const dirt = new THREE.Mesh(dirtGeo, dirtMat);
    dirt.position.y = -0.7;
    dirt.receiveShadow = true;
    platformGroup.add(dirt);

    scene.add(platformGroup);

    // 6. Build Crossy Road Voxel Dog Model
    const dog = new THREE.Group();
    materialsRef.current = [];

    // Materials
    const blackVoxelMat = new THREE.MeshStandardMaterial({
      color: 0x16171a, // Pure charcoal black voxel
      roughness: 0.5,
      metalness: 0.05,
      flatShading: true,
    });
    materialsRef.current.push(blackVoxelMat);

    const redCollarMat = new THREE.MeshStandardMaterial({
      color: 0xee2222, // Iconic bright red collar
      roughness: 0.4,
      metalness: 0.05,
      flatShading: true,
    });
    materialsRef.current.push(redCollarMat);

    const goldBuckleMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00, // Yellow golden brass buckle
      roughness: 0.3,
      metalness: 0.6,
      flatShading: true,
    });
    materialsRef.current.push(goldBuckleMat);

    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const tongueMat = new THREE.MeshStandardMaterial({ color: 0xff88aa, flatShading: true });

    // A. Torso Voxel Block (Rectangular block)
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.6, 1.05);
    const torsoMesh = new THREE.Mesh(torsoGeo, blackVoxelMat);
    torsoMesh.position.set(0, 0.72, -0.05);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    dog.add(torsoMesh);

    // B. Neck Block
    const neckGeo = new THREE.BoxGeometry(0.5, 0.35, 0.45);
    const neckMesh = new THREE.Mesh(neckGeo, blackVoxelMat);
    neckMesh.position.set(0, 0.95, 0.35);
    neckMesh.castShadow = true;
    dog.add(neckMesh);

    // C. RED COLLAR VOXEL RING (Signature feature)
    const collarGeo = new THREE.BoxGeometry(0.56, 0.12, 0.52);
    const collarMesh = new THREE.Mesh(collarGeo, redCollarMat);
    collarMesh.position.set(0, 0.88, 0.36);
    collarMesh.castShadow = true;
    dog.add(collarMesh);

    // Gold Buckle / Dangling Tag Voxel
    const buckleGeo = new THREE.BoxGeometry(0.14, 0.14, 0.06);
    const buckleMesh = new THREE.Mesh(buckleGeo, goldBuckleMat);
    buckleMesh.position.set(0, 0.85, 0.63);
    buckleMesh.castShadow = true;
    dog.add(buckleMesh);

    // D. Head Voxel Block
    const headGeo = new THREE.BoxGeometry(0.72, 0.68, 0.68);
    const headMesh = new THREE.Mesh(headGeo, blackVoxelMat);
    headMesh.position.set(0, 1.28, 0.42);
    headMesh.castShadow = true;
    dog.add(headMesh);

    // Snout / Muzzle Block
    const snoutGeo = new THREE.BoxGeometry(0.42, 0.32, 0.36);
    const snoutMesh = new THREE.Mesh(snoutGeo, blackVoxelMat);
    snoutMesh.position.set(0, 1.15, 0.85);
    snoutMesh.castShadow = true;
    dog.add(snoutMesh);

    // Nose Block (Top of snout)
    const noseGeo = new THREE.BoxGeometry(0.18, 0.12, 0.1);
    const noseMesh = new THREE.Mesh(noseGeo, new THREE.MeshBasicMaterial({ color: 0x08080a }));
    noseMesh.position.set(0, 1.25, 1.01);
    dog.add(noseMesh);

    // Cute Pink Tongue (Under snout)
    const tongueGeo = new THREE.BoxGeometry(0.16, 0.08, 0.14);
    const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
    tongueMesh.position.set(0, 1.0, 0.88);
    dog.add(tongueMesh);

    // Voxel Eyes (Googly-style Crossy Eyes)
    const makeEye = (x: number) => {
      const eyeGroup = new THREE.Group();
      // Eye White Box
      const whiteGeo = new THREE.BoxGeometry(0.2, 0.2, 0.04);
      const white = new THREE.Mesh(whiteGeo, eyeWhiteMat);
      eyeGroup.add(white);
      // Pupil Box
      const pupilGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
      const pupil = new THREE.Mesh(pupilGeo, eyePupilMat);
      pupil.position.set(0, 0, 0.01);
      eyeGroup.add(pupil);

      eyeGroup.position.set(x, 1.35, 0.76);
      return eyeGroup;
    };
    dog.add(makeEye(0.22));
    dog.add(makeEye(-0.22));

    // Voxel Ears (Floppy / Upright crossy style)
    const makeEar = (x: number, isRight: boolean) => {
      const earGroup = new THREE.Group();
      // Base ear block
      const earBaseGeo = new THREE.BoxGeometry(0.14, 0.28, 0.22);
      const earBase = new THREE.Mesh(earBaseGeo, blackVoxelMat);
      earBase.position.set(0, 0.14, 0);
      earBase.castShadow = true;
      earGroup.add(earBase);

      // Drooping flap
      const earFlapGeo = new THREE.BoxGeometry(0.12, 0.22, 0.18);
      const earFlap = new THREE.Mesh(earFlapGeo, blackVoxelMat);
      earFlap.position.set(isRight ? -0.06 : 0.06, -0.05, 0);
      earFlap.castShadow = true;
      earGroup.add(earFlap);

      earGroup.position.set(x, 1.48, 0.38);
      return earGroup;
    };
    dog.add(makeEar(0.42, false));
    dog.add(makeEar(-0.42, true));

    // E. 4 Voxel Legs
    const makeLeg = (x: number, z: number) => {
      const legGroup = new THREE.Group();
      const legGeo = new THREE.BoxGeometry(0.18, 0.44, 0.2);
      const legMesh = new THREE.Mesh(legGeo, blackVoxelMat);
      legMesh.position.set(0, 0.22, 0);
      legMesh.castShadow = true;
      legGroup.add(legMesh);

      // Paw foot block
      const pawGeo = new THREE.BoxGeometry(0.18, 0.1, 0.26);
      const pawMesh = new THREE.Mesh(pawGeo, blackVoxelMat);
      pawMesh.position.set(0, 0.05, 0.03);
      pawMesh.castShadow = true;
      legGroup.add(pawMesh);

      legGroup.position.set(x, 0, z);
      return legGroup;
    };

    // Front Left & Right
    const flLeg = makeLeg(0.22, 0.32);
    const frLeg = makeLeg(-0.22, 0.32);
    // Back Left & Right
    const blLeg = makeLeg(0.22, -0.42);
    const brLeg = makeLeg(-0.22, -0.42);

    dog.add(flLeg);
    dog.add(frLeg);
    dog.add(blLeg);
    dog.add(brLeg);

    // F. Stepped Voxel Tail (Angled 45 degrees up)
    const tailGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const segGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const segMesh = new THREE.Mesh(segGeo, blackVoxelMat);
      segMesh.position.set(0, i * 0.12, -i * 0.12);
      segMesh.castShadow = true;
      tailGroup.add(segMesh);
    }
    tailGroup.position.set(0, 0.85, -0.58);
    dog.add(tailGroup);

    scene.add(dog);
    dogGroupRef.current = dog;

    // 7. Interaction handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dogGroupRef.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      dogGroupRef.current.rotation.y += deltaX * 0.01;

      if (cameraRef.current) {
        cameraRef.current.position.y = Math.max(1.0, Math.min(4.5, cameraRef.current.position.y + deltaY * 0.005));
        cameraRef.current.lookAt(0, 0.8, 0);
      }

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !dogGroupRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      dogGroupRef.current.rotation.y += deltaX * 0.012;
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    // 8. Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (dogGroupRef.current) {
        if (isRotatingRef.current && !isDraggingRef.current) {
          dogGroupRef.current.rotation.y += delta * rotationSpeedRef.current * 0.9;
        }

        // Crossy Hop Animation
        if (isHoppingRef.current) {
          hopTimeRef.current += delta * 6;
          const jumpHeight = Math.sin(hopTimeRef.current % Math.PI);
          dogGroupRef.current.position.y = Math.max(0, jumpHeight * 0.45);
          // Squash and stretch
          if (jumpHeight > 0) {
            dogGroupRef.current.scale.set(0.92, 1.12, 0.92);
          } else {
            dogGroupRef.current.scale.set(1.08, 0.92, 1.08);
          }
        } else {
          dogGroupRef.current.position.y = 0;
          dogGroupRef.current.scale.set(1, 1, 1);
        }

        let deg = (dogGroupRef.current.rotation.y * (180 / Math.PI)) % 360;
        if (deg < 0) deg += 360;
        setCurrentAngleDeg(Math.round(deg));
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animFrameIdRef.current = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 520;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Handle render mode (Wireframe, Silhouette)
  useEffect(() => {
    if (!sceneRef.current) return;
    materialsRef.current.forEach((mat) => {
      if (mat instanceof THREE.MeshStandardMaterial) {
        if (renderMode === 'wireframe') {
          mat.wireframe = true;
          mat.color.setHex(0x0284c7);
        } else if (renderMode === 'silhouette') {
          mat.wireframe = false;
          mat.color.setHex(0x111111);
        } else {
          mat.wireframe = false;
          if (mat === materialsRef.current[0]) mat.color.setHex(0x16171a); // Black fur
          if (mat === materialsRef.current[1]) mat.color.setHex(0xee2222); // Red collar
          if (mat === materialsRef.current[2]) mat.color.setHex(0xffcc00); // Gold buckle
        }
      }
    });
  }, [renderMode]);

  // Cardinal snap
  const snapToAngle = useCallback((deg: number) => {
    if (!dogGroupRef.current) return;
    setIsRotating(false);
    dogGroupRef.current.rotation.y = (deg * Math.PI) / 180;
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 1.2, 4.2);
      cameraRef.current.lookAt(0, 0.8, 0);
    }
  }, []);

  const snapToIsometric = useCallback(() => {
    if (!dogGroupRef.current) return;
    setIsRotating(false);
    dogGroupRef.current.rotation.y = 0.785; // 45 deg
    if (cameraRef.current) {
      cameraRef.current.position.set(3.2, 2.8, 3.8);
      cameraRef.current.lookAt(0, 0.8, 0);
    }
  }, []);

  const getViewName = (deg: number) => {
    if (deg >= 335 || deg < 25) return '前視圖 FRONT (0°)';
    if (deg >= 65 && deg <= 115) return '右側視圖 RIGHT (90°)';
    if (deg >= 155 && deg <= 205) return '後視圖 BACK (180°)';
    if (deg >= 245 && deg <= 295) return '左側視圖 LEFT (270°)';
    return `${deg}° 體素自由角 (Free Angle)`;
  };

  return (
    <div className={`relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/90 border-b border-slate-800 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            Crossy Road 體素 3D 轉台 (Voxel Turntable)
          </h3>
          <span className="text-xs text-sky-400 font-mono hidden sm:inline">
            · {getViewName(currentAngleDeg)}
          </span>
        </div>

        {/* Quick View Angle Snap Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => snapToAngle(0)}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            前視 0°
          </button>
          <button
            onClick={() => snapToAngle(90)}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            右側 90°
          </button>
          <button
            onClick={() => snapToAngle(180)}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            後視 180°
          </button>
          <button
            onClick={() => snapToAngle(270)}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            左側 270°
          </button>
          <button
            onClick={snapToIsometric}
            className="px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 rounded transition border border-amber-500/30"
          >
            等角透視 Iso
          </button>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div
        className="w-full h-[460px] sm:h-[520px] cursor-grab active:cursor-grabbing relative select-none"
        title="按住滑鼠左鍵可 360 度自由旋轉體素模型"
      >
        <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Crossy Angle HUD */}
      <div className="absolute top-16 left-4 bg-slate-950/85 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono backdrop-blur-md pointer-events-none flex items-center gap-2 shadow-lg">
        <Compass className="w-4 h-4 text-sky-400" />
        <div>
          <div className="text-slate-400 text-[10px]">VOXEL YAW</div>
          <div className="text-sky-300 font-bold">{currentAngleDeg}°</div>
        </div>
      </div>

      {/* Style Label Badge */}
      <div className="absolute top-16 right-4 flex flex-col gap-1.5 pointer-events-none text-right">
        <div className="bg-red-950/80 border border-red-500/60 text-red-200 text-xs px-2.5 py-1 rounded backdrop-blur-md">
          ● 亮紅項圈 (Red Voxel Collar)
        </div>
        <div className="bg-slate-950/80 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded backdrop-blur-md">
          ● 純黑體素方塊 (Crossy Voxel)
        </div>
      </div>

      {/* Bottom Bar: Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/90 border-t border-slate-800 z-10">
        <div className="flex items-center gap-2">
          {/* Hop Button */}
          <button
            onClick={() => setIsHopping(!isHopping)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isHopping
                ? 'bg-emerald-600 border-emerald-500 text-white animate-pulse'
                : 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
            }`}
            title="天天過馬路招牌跳躍動作 (Crossy Hop)"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>{isHopping ? '停止跳躍' : '經典跳躍 (Hop!)'}</span>
          </button>

          {/* Turntable Auto-rotate */}
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              isRotating
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-sky-600 border-sky-500 text-white hover:bg-sky-500'
            }`}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRotating ? '暫停轉動' : '自動轉台'}</span>
          </button>

          {/* Speed Slider */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] text-slate-400">轉速</span>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.2"
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
              className="w-14 h-1.5 accent-sky-400 bg-slate-700 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Shading Mode */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setRenderMode('shaded')}
            className={`px-2.5 py-1 text-xs rounded transition ${
              renderMode === 'shaded' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            體素實體
          </button>
          <button
            onClick={() => setRenderMode('wireframe')}
            className={`px-2.5 py-1 text-xs rounded transition ${
              renderMode === 'wireframe' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            立方網格
          </button>
          <button
            onClick={() => setRenderMode('silhouette')}
            className={`px-2.5 py-1 text-xs rounded transition ${
              renderMode === 'silhouette' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            像素剪影
          </button>
        </div>
      </div>
    </div>
  );
};
