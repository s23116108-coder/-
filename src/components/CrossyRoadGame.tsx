import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Coins,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { playSound } from '../utils/audio';

type TrafficLightState = 'green' | 'yellow' | 'red';

export const ZONE_INFO: Record<
  Lane['type'],
  { label: string; dotColor: string; textColor: string; bgColor: string }
> = {
  grass: {
    label: '草地區域 (綠色)',
    dotColor: '#78c800',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-950/70 border-emerald-500/40',
  },
  road: {
    label: '馬路區域 (深灰色)',
    dotColor: '#94a3b8',
    textColor: 'text-slate-200',
    bgColor: 'bg-slate-900 border-slate-700',
  },
  river: {
    label: '河流區域 (水藍色)',
    dotColor: '#38bdf8',
    textColor: 'text-sky-400',
    bgColor: 'bg-sky-950/70 border-sky-500/40',
  },
  rail: {
    label: '鐵道區域 (棕褐色)',
    dotColor: '#d97706',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-950/70 border-amber-500/40',
  },
};

interface TrafficLight {
  state: TrafficLightState;
  timer: number;
  greenDuration: number;
  yellowDuration: number;
  redDuration: number;
  meshGroup: THREE.Group;
  redLensMat: THREE.MeshStandardMaterial;
  yellowLensMat: THREE.MeshStandardMaterial;
  greenLensMat: THREE.MeshStandardMaterial;
}

interface Vehicle {
  mesh: THREE.Group;
  x: number;
  speed: number;
  length: number;
  width: number;
}

interface Log {
  mesh: THREE.Mesh;
  x: number;
  speed: number;
  length: number;
}

interface CoinItem {
  id: string;
  mesh: THREE.Group;
  x: number;
  z: number;
  collected: boolean;
}

interface Lane {
  index: number;
  z: number;
  type: 'grass' | 'road' | 'river' | 'rail';
  groundMesh: THREE.Mesh;
  trafficLight?: TrafficLight;
  hasPhysicalLight?: boolean;
  roadId?: number;
  vehicles?: Vehicle[];
  logs?: Log[];
  coins?: CoinItem[];
  trees?: THREE.Group[];
  obstacleXs?: number[]; // trees / rocks on grass
  direction?: number; // 1 or -1
  speed?: number;
  trainActive?: boolean;
  trainTimer?: number;
  trainMesh?: THREE.Group;
}

export const CrossyRoadGame: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Game UI States
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('crossy_dog_highscore') || '0', 10);
  });
  const [coins, setCoins] = useState(15); // Starting with 15 coins
  const [totalCoinsCollected, setTotalCoinsCollected] = useState(0);
  const [redLightViolations, setRedLightViolations] = useState(0);
  const [safeCrossings, setSafeCrossings] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentLaneStatus, setCurrentLaneStatus] = useState<{
    isRoad: boolean;
    lightState?: TrafficLightState;
    timeRemaining?: number;
  }>({ isRoad: false });

  // 20-Second Same Color Area Timer States
  const [colorAreaRemaining, setColorAreaRemaining] = useState(20.0);
  const [currentColorType, setCurrentColorType] = useState<Lane['type']>('grass');
  const lastUiTimeRef = useRef(20.0);
  const lastUiTypeRef = useRef<Lane['type']>('grass');

  // Floating notifications
  const [floatingNotice, setFloatingNotice] = useState<{
    text: string;
    type: 'penalty' | 'safe' | 'coin';
    id: number;
  } | null>(null);

  // References for Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const dogMeshRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Game Gameplay Variables in Ref
  const playerRef = useRef({
    x: 0,
    z: 0,
    targetX: 0,
    targetZ: 0,
    isHopping: false,
    hopProgress: 0,
    rotation: 0,
    currentLog: null as Log | null,
    dead: false,
    currentColorArea: 'grass' as Lane['type'],
    colorAreaTimer: 0,
  });

  const lanesRef = useRef<Map<number, Lane>>(new Map());
  const maxZRef = useRef(0);
  const coinsRef = useRef(15);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Show floating alert
  const triggerNotice = useCallback((text: string, type: 'penalty' | 'safe' | 'coin') => {
    setFloatingNotice({ text, type, id: Date.now() });
    setTimeout(() => {
      setFloatingNotice((prev) => (prev && Date.now() - prev.id >= 1400 ? null : prev));
    }, 1500);
  }, []);

  // --- Voxel Dog Builder (Black Fur + Red Collar) ---
  const createVoxelDog = () => {
    const dog = new THREE.Group();

    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x16171a,
      roughness: 0.5,
      flatShading: true,
    });
    const redCollarMat = new THREE.MeshStandardMaterial({
      color: 0xee2222,
      roughness: 0.35,
      flatShading: true,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.25,
      metalness: 0.6,
      flatShading: true,
    });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const tongueMat = new THREE.MeshStandardMaterial({ color: 0xff88aa, flatShading: true });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.9), blackMat);
    torso.position.set(0, 0.55, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    dog.add(torso);

    // Neck
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.4), blackMat);
    neck.position.set(0, 0.75, 0.3);
    neck.castShadow = true;
    dog.add(neck);

    // RED COLLAR VOXEL RING
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.46), redCollarMat);
    collar.position.set(0, 0.68, 0.3);
    collar.castShadow = true;
    dog.add(collar);

    // Golden Buckle
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), goldMat);
    buckle.position.set(0, 0.66, 0.54);
    dog.add(buckle);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.55), blackMat);
    head.position.set(0, 1.05, 0.35);
    head.castShadow = true;
    dog.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.26, 0.3), blackMat);
    snout.position.set(0, 0.95, 0.7);
    snout.castShadow = true;
    dog.add(snout);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.08), new THREE.MeshBasicMaterial({ color: 0x050505 }));
    nose.position.set(0, 1.02, 0.85);
    dog.add(nose);

    // Pink Tongue
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), tongueMat);
    tongue.position.set(0, 0.83, 0.72);
    dog.add(tongue);

    // Voxel Eyes
    const addEye = (x: number) => {
      const eyeWhite = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.04), eyeWhiteMat);
      eyeWhite.position.set(x, 1.1, 0.63);
      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyePupilMat);
      pupil.position.set(x, 1.1, 0.64);
      dog.add(eyeWhite);
      dog.add(pupil);
    };
    addEye(0.18);
    addEye(-0.18);

    // Drooping / Folded Ears
    const addEar = (x: number) => {
      const earBase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.18), blackMat);
      earBase.position.set(x, 1.25, 0.32);
      earBase.castShadow = true;
      const earTip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.14), blackMat);
      earTip.position.set(x > 0 ? x + 0.05 : x - 0.05, 1.12, 0.32);
      earTip.castShadow = true;
      dog.add(earBase);
      dog.add(earTip);
    };
    addEar(0.34);
    addEar(-0.34);

    // 4 Legs
    const addLeg = (x: number, z: number) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.16), blackMat);
      leg.position.set(x, 0.18, z);
      leg.castShadow = true;
      dog.add(leg);
    };
    addLeg(0.2, 0.25);
    addLeg(-0.2, 0.25);
    addLeg(0.2, -0.28);
    addLeg(-0.2, -0.28);

    // Stepped Tail
    const tail = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), blackMat);
      t.position.set(0, i * 0.1, -i * 0.1);
      tail.add(t);
    }
    tail.position.set(0, 0.68, -0.45);
    dog.add(tail);

    return dog;
  };

  // --- Traffic Light Builder ---
  const createTrafficLightMesh = (initialState: TrafficLightState) => {
    const group = new THREE.Group();

    // Post
    const postGeo = new THREE.BoxGeometry(0.12, 2.2, 0.12);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.7, flatShading: true });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 1.1;
    post.castShadow = true;
    group.add(post);

    // Light Housing Box
    const boxGeo = new THREE.BoxGeometry(0.36, 1.0, 0.26);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.6, flatShading: true });
    const housing = new THREE.Mesh(boxGeo, boxMat);
    housing.position.set(0, 1.7, 0);
    housing.castShadow = true;
    group.add(housing);

    // Visors / Hoods over lenses
    for (let i = 0; i < 3; i++) {
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.12), boxMat);
      visor.position.set(0, 2.05 - i * 0.3, 0.18);
      group.add(visor);
    }

    // 3 Lenses: Red (Top), Yellow (Middle), Green (Bottom)
    const redMat = new THREE.MeshStandardMaterial({
      color: 0x330000,
      emissive: initialState === 'red' ? 0xff2222 : 0x000000,
      emissiveIntensity: initialState === 'red' ? 2.5 : 0,
      roughness: 0.2,
      flatShading: true,
    });
    const redLens = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.08), redMat);
    redLens.position.set(0, 2.0, 0.13);
    group.add(redLens);

    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0x332a00,
      emissive: initialState === 'yellow' ? 0xffdd00 : 0x000000,
      emissiveIntensity: initialState === 'yellow' ? 2.2 : 0,
      roughness: 0.2,
      flatShading: true,
    });
    const yellowLens = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.08), yellowMat);
    yellowLens.position.set(0, 1.7, 0.13);
    group.add(yellowLens);

    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x003300,
      emissive: initialState === 'green' ? 0x00ff44 : 0x000000,
      emissiveIntensity: initialState === 'green' ? 2.5 : 0,
      roughness: 0.2,
      flatShading: true,
    });
    const greenLens = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.08), greenMat);
    greenLens.position.set(0, 1.4, 0.13);
    group.add(greenLens);

    return {
      group,
      redMat,
      yellowMat,
      greenMat,
    };
  };

  // --- Voxel Vehicle Builder ---
  const createVehicleMesh = (type: 'car' | 'taxi' | 'truck') => {
    const group = new THREE.Group();
    const colors = {
      car: [0x38bdf8, 0xef4444, 0x8b5cf6, 0xf97316],
      taxi: [0xffcc00],
      truck: [0xf59e0b, 0x10b981],
    };

    const color = colors[type][Math.floor(Math.random() * colors[type].length)];
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, flatShading: true });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, flatShading: true });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.2, flatShading: true });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, flatShading: true });

    if (type === 'truck') {
      // Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 0.85), bodyMat);
      cab.position.set(0.8, 0.55, 0);
      cab.castShadow = true;
      group.add(cab);

      // Cargo Container
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.95), whiteMat);
      cargo.position.set(-0.55, 0.7, 0);
      cargo.castShadow = true;
      group.add(cargo);

      // Wheels
      for (const wx of [-1.1, -0.3, 0.9]) {
        for (const wz of [-0.5, 0.5]) {
          const wheel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.12), wheelMat);
          wheel.position.set(wx, 0.15, wz);
          group.add(wheel);
        }
      }
    } else {
      // Sedan / Taxi
      const lower = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.8), bodyMat);
      lower.position.set(0, 0.35, 0);
      lower.castShadow = true;
      group.add(lower);

      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 0.72), glassMat);
      upper.position.set(-0.08, 0.72, 0);
      upper.castShadow = true;
      group.add(upper);

      if (type === 'taxi') {
        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.18), whiteMat);
        sign.position.set(-0.08, 0.98, 0);
        group.add(sign);
      }

      // Wheels
      for (const wx of [-0.48, 0.48]) {
        for (const wz of [-0.42, 0.42]) {
          const wheel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.12), wheelMat);
          wheel.position.set(wx, 0.15, wz);
          group.add(wheel);
        }
      }
    }

    return group;
  };

  // --- Coin Builder ---
  const createCoinMesh = () => {
    const group = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.4,
      metalness: 0.85,
      roughness: 0.2,
      flatShading: true,
    });

    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), goldMat);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    group.add(coin);
    group.position.y = 0.35;
    return group;
  };

  // --- Procedural Lane Generator ---
  const generateLane = (z: number): Lane => {
    const scene = sceneRef.current!;

    const prevLane = lanesRef.current.get(z - 1);
    const prevPrevLane = lanesRef.current.get(z - 2);
    const prev3Lane = lanesRef.current.get(z - 3);

    // Decide lane type with natural road clustering
    let type: Lane['type'] = 'grass';
    if (z <= 2) {
      type = 'grass';
    } else if (prevLane?.type === 'road' && prevPrevLane?.type === 'road' && prev3Lane?.type === 'road') {
      // Max 3 connected road lanes, then break with grass
      type = 'grass';
    } else if (prevLane?.type === 'road' && prevPrevLane?.type === 'road' && Math.random() < 0.6) {
      // Natural road break after 2 lanes
      type = 'grass';
    } else if (prevLane?.type === 'river' && prevPrevLane?.type === 'river' && Math.random() < 0.6) {
      type = 'grass';
    } else {
      const rand = Math.random();
      if (rand < 0.45) {
        type = 'road';
      } else if (rand < 0.7) {
        type = 'river';
      } else if (rand < 0.8) {
        type = 'rail';
      } else {
        type = 'grass';
      }
    }

    let groundColor = 0x78c800; // vibrant green grass
    if (type === 'road') groundColor = 0x33353d; // dark asphalt
    if (type === 'river') groundColor = 0x1e88e5; // bright blue water
    if (type === 'rail') groundColor = 0x5d4037; // railway gravel

    const groundGeo = new THREE.BoxGeometry(32, 0.6, 1.0);
    const groundMat = new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.7,
      flatShading: true,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.set(0, -0.3, z);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Subtle road stripes
    if (type === 'road') {
      for (let x = -10; x <= 10; x += 3.0) {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.02, 0.12),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        stripe.position.set(x, 0.01, z);
        groundMesh.add(stripe);
      }
    }

    const lane: Lane = {
      index: z,
      z,
      type,
      groundMesh,
    };

    // If Road: 接在一起的路算做同一條路，一條路只能有一個紅綠燈！
    if (type === 'road') {
      if (prevLane && prevLane.type === 'road' && prevLane.trafficLight) {
        // 接在一起的車道算作同一條馬路：繼承前一行車道的同一座紅綠燈，絕對不產生新立柱！
        lane.trafficLight = prevLane.trafficLight;
        lane.hasPhysicalLight = false;
        lane.roadId = prevLane.roadId ?? prevLane.z;
      } else {
        // 新獨立馬路的第一條車道：生成該路段「唯一」的一座紅綠燈立柱
        const initialLight: TrafficLightState = Math.random() < 0.5 ? 'green' : 'red';
        const { group: lightGroup, redMat, yellowMat, greenMat } = createTrafficLightMesh(initialLight);

        // Position single traffic light on the right edge of this road
        lightGroup.position.set(5.8, 0, z);
        lightGroup.rotation.y = -Math.PI / 4;
        scene.add(lightGroup);

        const trafficLight: TrafficLight = {
          state: initialLight,
          timer: Math.random() * 3 + 2,
          greenDuration: 5.0,
          yellowDuration: 1.8,
          redDuration: 4.0,
          meshGroup: lightGroup,
          redLensMat: redMat,
          yellowLensMat: yellowMat,
          greenLensMat: greenMat,
        };

        lane.trafficLight = trafficLight;
        lane.hasPhysicalLight = true;
        lane.roadId = z;
      }

      // Spawn moving vehicles
      const direction = Math.random() < 0.5 ? 1 : -1;
      const speed = (Math.random() * 2.2 + 2.5) * direction;
      lane.direction = direction;
      lane.speed = speed;

      const vehicles: Vehicle[] = [];
      const numVehicles = Math.floor(Math.random() * 2) + 2;
      const vehicleTypes: ('car' | 'taxi' | 'truck')[] = ['car', 'taxi', 'truck'];

      for (let i = 0; i < numVehicles; i++) {
        const vType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        const vMesh = createVehicleMesh(vType);
        if (direction === -1) vMesh.rotation.y = Math.PI;

        const xPos = (i * 9 - 9 + Math.random() * 2) * direction;
        vMesh.position.set(xPos, 0, z);
        scene.add(vMesh);

        vehicles.push({
          mesh: vMesh,
          x: xPos,
          speed,
          length: vType === 'truck' ? 2.6 : 1.7,
          width: 0.8,
        });
      }
      lane.vehicles = vehicles;
    }

    // If River: Add Floating Logs
    if (type === 'river') {
      const direction = Math.random() < 0.5 ? 1 : -1;
      const speed = (Math.random() * 1.5 + 1.2) * direction;
      lane.direction = direction;
      lane.speed = speed;

      const logs: Log[] = [];
      const numLogs = 3;
      const logMat = new THREE.MeshStandardMaterial({
        color: 0x8d5b35,
        roughness: 0.8,
        flatShading: true,
      });

      for (let i = 0; i < numLogs; i++) {
        const length = Math.random() < 0.5 ? 2.6 : 3.6;
        const logMesh = new THREE.Mesh(new THREE.BoxGeometry(length, 0.35, 0.8), logMat);
        logMesh.position.set(i * 6 - 6 + Math.random(), 0.1, z);
        logMesh.castShadow = true;
        logMesh.receiveShadow = true;
        scene.add(logMesh);

        logs.push({
          mesh: logMesh,
          x: logMesh.position.x,
          speed,
          length,
        });
      }
      lane.logs = logs;
    }

    // If Grass: Add Trees and Coins
    if (type === 'grass') {
      const obstacleXs: number[] = [];
      const trees: THREE.Group[] = [];
      // Trees on sides and random obstacles
      for (let x = -8; x <= 8; x++) {
        if (x < -5 || x > 5 || (z > 2 && Math.random() < 0.22)) {
          obstacleXs.push(x);
          const treeGroup = new THREE.Group();
          // Trunk
          const trunk = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.6, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x6d4c41, flatShading: true })
          );
          trunk.position.y = 0.3;
          trunk.castShadow = true;
          treeGroup.add(trunk);

          // Foliage block
          const foliage = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.9, 0.85),
            new THREE.MeshStandardMaterial({
              color: Math.random() < 0.5 ? 0x558b2f : 0x689f38,
              flatShading: true,
            })
          );
          foliage.position.y = 0.95;
          foliage.castShadow = true;
          treeGroup.add(foliage);

          treeGroup.position.set(x, 0, z);
          scene.add(treeGroup);
          trees.push(treeGroup);
        }
      }
      lane.trees = trees;
      lane.obstacleXs = obstacleXs;

      // Random coin on grass
      if (z > 1 && Math.random() < 0.45) {
        const coinX = Math.floor(Math.random() * 7) - 3;
        if (!obstacleXs.includes(coinX)) {
          const coinMesh = createCoinMesh();
          coinMesh.position.set(coinX, 0.35, z);
          scene.add(coinMesh);

          lane.coins = [
            {
              id: `coin_${z}_${coinX}`,
              mesh: coinMesh,
              x: coinX,
              z,
              collected: false,
            },
          ];
        }
      }
    }

    return lane;
  };

  // --- Reset & Start Game ---
  const resetGame = useCallback(() => {
    // Clear old scene meshes
    if (sceneRef.current) {
      lanesRef.current.forEach((lane) => {
        if (lane.groundMesh) sceneRef.current?.remove(lane.groundMesh);
        if (lane.hasPhysicalLight && lane.trafficLight) sceneRef.current?.remove(lane.trafficLight.meshGroup);
        lane.vehicles?.forEach((v) => sceneRef.current?.remove(v.mesh));
        lane.logs?.forEach((l) => sceneRef.current?.remove(l.mesh));
        lane.coins?.forEach((c) => sceneRef.current?.remove(c.mesh));
        lane.trees?.forEach((t) => sceneRef.current?.remove(t));
      });
      lanesRef.current.clear();
    }

    // Reset player
    playerRef.current = {
      x: 0,
      z: 0,
      targetX: 0,
      targetZ: 0,
      isHopping: false,
      hopProgress: 0,
      rotation: 0,
      currentLog: null,
      dead: false,
      currentColorArea: 'grass',
      colorAreaTimer: 0,
    };

    if (dogMeshRef.current) {
      dogMeshRef.current.position.set(0, 0, 0);
      dogMeshRef.current.rotation.set(0, 0, 0);
      dogMeshRef.current.scale.set(1, 1, 1);
    }

    setCoins(15);
    coinsRef.current = 15;
    setScore(0);
    maxZRef.current = 0;
    setIsGameOver(false);
    setGameOverReason('');
    setRedLightViolations(0);
    setSafeCrossings(0);
    setTotalCoinsCollected(0);
    setFloatingNotice(null);
    setColorAreaRemaining(20.0);
    setCurrentColorType('grass');
    lastUiTimeRef.current = 20.0;
    lastUiTypeRef.current = 'grass';

    // Generate initial 25 rows
    for (let z = -3; z <= 22; z++) {
      const lane = generateLane(z);
      lanesRef.current.set(z, lane);
    }
  }, []);

  // --- Hop Movement Execution ---
  const tryHop = useCallback(
    (dx: number, dz: number) => {
      const p = playerRef.current;
      if (p.dead || p.isHopping) return;

      const nextX = Math.round(p.x + dx);
      const nextZ = Math.round(p.z + dz);

      // Boundaries
      if (nextX < -5 || nextX > 5) return;
      if (nextZ < p.z - 2) return; // cannot move too far back

      // Check obstacle collisions (trees)
      const targetLane = lanesRef.current.get(nextZ);
      if (targetLane && targetLane.obstacleXs && targetLane.obstacleXs.some((obsX) => Math.abs(obsX - nextX) < 0.65)) {
        return; // blocked by tree!
      }

      // Valid hop!
      p.targetX = nextX;
      p.targetZ = nextZ;
      p.isHopping = true;
      p.hopProgress = 0;

      // Check zone color change: Stepping into a different color area resets the 20s stay timer!
      const targetType: Lane['type'] = targetLane ? targetLane.type : 'grass';
      const isColorAreaChanged = targetType !== p.currentColorArea;
      if (isColorAreaChanged) {
        p.currentColorArea = targetType;
        p.colorAreaTimer = 0;
        lastUiTimeRef.current = 20.0;
        lastUiTypeRef.current = targetType;
        setColorAreaRemaining(20.0);
        setCurrentColorType(targetType);
      }

      // Compute facing rotation
      if (dz > 0) p.rotation = 0;
      else if (dz < 0) p.rotation = Math.PI;
      else if (dx > 0) p.rotation = Math.PI / 2;
      else if (dx < 0) p.rotation = -Math.PI / 2;

      if (soundEnabledRef.current) {
        playSound('hop');
      }

      // --- CRITICAL TRAFFIC LIGHT RULE CHECK ---
      // If moving into a road lane:
      if (targetLane && targetLane.type === 'road' && targetLane.trafficLight) {
        const lightState = targetLane.trafficLight.state;

        if (lightState === 'red') {
          // RED LIGHT VIOLATION PENALTY!
          const newCoinBalance = Math.max(0, coinsRef.current - 1);
          coinsRef.current = newCoinBalance;
          setCoins(newCoinBalance);
          setRedLightViolations((v) => v + 1);

          if (soundEnabledRef.current) {
            playSound('red_light_penalty');
          }

          triggerNotice('闖紅燈違規！扣除 1 金幣 ⚠️', 'penalty');
        } else {
          // GREEN OR YELLOW: SAFE PASSAGE!
          setSafeCrossings((c) => c + 1);
          if (soundEnabledRef.current) {
            playSound('safe_crossing');
          }
          triggerNotice(
            lightState === 'green' ? '綠燈安全通行 ✓' : '黃燈警戒通行 ✓',
            'safe'
          );
        }
      } else if (isColorAreaChanged) {
        // Safe transition notice for different terrain color
        triggerNotice(`進入${ZONE_INFO[targetType].label} · 20秒計時已重置！`, 'safe');
      }

      // Check coin pickup
      if (targetLane && targetLane.coins) {
        targetLane.coins.forEach((coin) => {
          if (!coin.collected && Math.abs(coin.x - nextX) < 0.5) {
            coin.collected = true;
            if (sceneRef.current) sceneRef.current.remove(coin.mesh);
            coinsRef.current += 1;
            setCoins((c) => c + 1);
            setTotalCoinsCollected((c) => c + 1);
            if (soundEnabledRef.current) {
              playSound('coin');
            }
            triggerNotice('+1 金幣 💰', 'coin');
          }
        });
      }

      // Update forward score
      if (nextZ > maxZRef.current) {
        maxZRef.current = nextZ;
        setScore(nextZ);
        if (nextZ > highScore) {
          setHighScore(nextZ);
          localStorage.setItem('crossy_dog_highscore', nextZ.toString());
        }

        // Generate more lanes ahead
        const generateAheadZ = nextZ + 18;
        if (!lanesRef.current.has(generateAheadZ)) {
          const newLane = generateLane(generateAheadZ);
          lanesRef.current.set(generateAheadZ, newLane);
        }

        // Clean up lanes far behind
        const removeZ = nextZ - 8;
        if (lanesRef.current.has(removeZ)) {
          const oldLane = lanesRef.current.get(removeZ)!;
          if (oldLane.groundMesh) sceneRef.current?.remove(oldLane.groundMesh);
          if (oldLane.hasPhysicalLight && oldLane.trafficLight) {
            sceneRef.current?.remove(oldLane.trafficLight.meshGroup);
          }
          oldLane.vehicles?.forEach((v) => sceneRef.current?.remove(v.mesh));
          oldLane.logs?.forEach((l) => sceneRef.current?.remove(l.mesh));
          oldLane.coins?.forEach((c) => sceneRef.current?.remove(c.mesh));
          oldLane.trees?.forEach((t) => sceneRef.current?.remove(t));
          lanesRef.current.delete(removeZ);
        }
      }
    },
    [highScore, triggerNotice]
  );

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) {
        if (e.code === 'Space' || e.code === 'Enter') resetGame();
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          tryHop(0, 1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          tryHop(0, -1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          tryHop(1, 0); // Swapped: A / Left arrow now executes direction 1
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          tryHop(-1, 0); // Swapped: D / Right arrow now executes direction -1
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tryHop, isGameOver, resetGame]);

  // Three.js Engine Lifecycle
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x99ddf2); // Vibrant sky
    scene.fog = new THREE.Fog(0x99ddf2, 18, 38);
    sceneRef.current = scene;

    // 2. Camera: Isometric Crossy Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(-7.0, 9.5, -4.5);
    camera.lookAt(0, 0, 3);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x88cc88, 0.65);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xfffee0, 1.7);
    sun.position.set(-6, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 45;
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    scene.add(sun);

    // 5. Build Dog
    const dog = createVoxelDog();
    dog.position.set(0, 0, 0);
    scene.add(dog);
    dogMeshRef.current = dog;

    // Generate initial world
    resetGame();

    // 6. Game Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;

      const p = playerRef.current;

      // A. Update Traffic Lights (once per unique road traffic light)
      const updatedLights = new Set<TrafficLight>();
      lanesRef.current.forEach((lane) => {
        if (lane.trafficLight && !updatedLights.has(lane.trafficLight)) {
          updatedLights.add(lane.trafficLight);
          const tl = lane.trafficLight;
          tl.timer -= dt;

          if (tl.timer <= 0) {
            // Cycle: Green -> Yellow -> Red -> Green
            if (tl.state === 'green') {
              tl.state = 'yellow';
              tl.timer = tl.yellowDuration;
            } else if (tl.state === 'yellow') {
              tl.state = 'red';
              tl.timer = tl.redDuration;
            } else {
              tl.state = 'green';
              tl.timer = tl.greenDuration;
            }

            // Update 3D lens emissive materials
            tl.redLensMat.emissive.setHex(tl.state === 'red' ? 0xff2222 : 0x000000);
            tl.redLensMat.emissiveIntensity = tl.state === 'red' ? 2.5 : 0;

            tl.yellowLensMat.emissive.setHex(tl.state === 'yellow' ? 0xffdd00 : 0x000000);
            tl.yellowLensMat.emissiveIntensity = tl.state === 'yellow' ? 2.2 : 0;

            tl.greenLensMat.emissive.setHex(tl.state === 'green' ? 0x00ff44 : 0x000000);
            tl.greenLensMat.emissiveIntensity = tl.state === 'green' ? 2.5 : 0;
          }
        }
      });

      // Update HUD for current player lane
      const currentLane = lanesRef.current.get(Math.round(p.z));
      if (currentLane && currentLane.type === 'road' && currentLane.trafficLight) {
        setCurrentLaneStatus({
          isRoad: true,
          lightState: currentLane.trafficLight.state,
          timeRemaining: Math.ceil(currentLane.trafficLight.timer),
        });
      } else {
        setCurrentLaneStatus({ isRoad: false });
      }

      // B. Update Vehicles
      lanesRef.current.forEach((lane) => {
        if (lane.vehicles) {
          lane.vehicles.forEach((v) => {
            v.x += v.speed * dt;
            // Wrap around
            if (v.speed > 0 && v.x > 14) v.x = -14;
            if (v.speed < 0 && v.x < -14) v.x = 14;
            v.mesh.position.x = v.x;

            // Vehicle collision with dog
            if (!p.dead && Math.abs(p.z - lane.z) < 0.45 && Math.abs(p.x - v.x) < v.length / 2 + 0.3) {
              // Squash impact!
              p.dead = true;
              setIsGameOver(true);
              setGameOverReason('被過往車輛撞倒！');
              if (soundEnabledRef.current) playSound('squash');
              if (dogMeshRef.current) {
                dogMeshRef.current.scale.set(1.4, 0.15, 1.4);
                dogMeshRef.current.position.y = 0.05;
              }
            }
          });
        }
      });

      // C. Update River Logs
      let onAnyLog = false;
      lanesRef.current.forEach((lane) => {
        if (lane.logs) {
          lane.logs.forEach((log) => {
            log.x += log.speed * dt;
            if (log.speed > 0 && log.x > 12) log.x = -12;
            if (log.speed < 0 && log.x < -12) log.x = 12;
            log.mesh.position.x = log.x;

            // Check if player stands on this log
            if (!p.dead && !p.isHopping && Math.abs(p.z - lane.z) < 0.4) {
              if (Math.abs(p.x - log.x) < log.length / 2) {
                onAnyLog = true;
                p.x += log.speed * dt; // Drift with log
                p.targetX = p.x;
              }
            }
          });
        }
      });

      // D. River Drowning Check
      if (!p.dead && !p.isHopping && currentLane && currentLane.type === 'river') {
        if (!onAnyLog) {
          p.dead = true;
          setIsGameOver(true);
          setGameOverReason('掉入水中淹沒！');
          if (soundEnabledRef.current) playSound('splash');
          if (dogMeshRef.current) {
            dogMeshRef.current.position.y = -0.4;
            dogMeshRef.current.scale.set(0.6, 0.2, 0.6);
          }
        }
      }

      // Check if drifted out of bounds on log
      if (!p.dead && (p.x < -6.5 || p.x > 6.5)) {
        p.dead = true;
        setIsGameOver(true);
        setGameOverReason('飄出安全邊界！');
        if (soundEnabledRef.current) playSound('splash');
      }

      // E. Color Area 20-Second Timeout Rule Check
      if (!p.dead) {
        const currentZ = Math.round(p.isHopping ? p.targetZ : p.z);
        const playerCurrentLane = lanesRef.current.get(currentZ);
        const currentType: Lane['type'] = playerCurrentLane ? playerCurrentLane.type : 'grass';

        if (p.currentColorArea !== currentType) {
          p.currentColorArea = currentType;
          p.colorAreaTimer = 0;
          lastUiTimeRef.current = 20.0;
          lastUiTypeRef.current = currentType;
          setColorAreaRemaining(20.0);
          setCurrentColorType(currentType);
        } else {
          p.colorAreaTimer += dt;
          const remaining = Math.max(0, 20.0 - p.colorAreaTimer);
          if (Math.abs(remaining - lastUiTimeRef.current) >= 0.1 || remaining === 0) {
            lastUiTimeRef.current = remaining;
            setColorAreaRemaining(remaining);
            if (lastUiTypeRef.current !== currentType) {
              lastUiTypeRef.current = currentType;
              setCurrentColorType(currentType);
            }
          }
        }

        // Defeat Condition: Staying in the same color area for more than 20 seconds!
        if (p.colorAreaTimer >= 20.0) {
          p.dead = true;
          setIsGameOver(true);
          const zone = ZONE_INFO[p.currentColorArea];
          const areaName = zone ? zone.label : '同一顏色區域';
          setGameOverReason(`待在【${areaName}】超過 20 秒，遊戲失敗！`);
          if (soundEnabledRef.current) playSound('squash');
          if (dogMeshRef.current) {
            dogMeshRef.current.position.y += 1.8;
            dogMeshRef.current.scale.set(0.3, 0.3, 0.3);
          }
        }
      }

      // F. Smooth Hop Animation
      if (p.isHopping && dogMeshRef.current) {
        p.hopProgress += dt * 6.5; // ~0.15s hop duration
        if (p.hopProgress >= 1) {
          p.isHopping = false;
          p.hopProgress = 1;
          p.x = p.targetX;
          p.z = p.targetZ;
          dogMeshRef.current.position.set(p.x, 0, p.z);
          dogMeshRef.current.scale.set(1, 1, 1);
        } else {
          // Parabolic hop
          const t = p.hopProgress;
          const currentX = THREE.MathUtils.lerp(p.x, p.targetX, t);
          const currentZ = THREE.MathUtils.lerp(p.z, p.targetZ, t);
          const currentY = Math.sin(t * Math.PI) * 0.75;

          dogMeshRef.current.position.set(currentX, currentY, currentZ);

          // Squash and stretch
          const stretch = Math.sin(t * Math.PI);
          dogMeshRef.current.scale.set(1 - stretch * 0.15, 1 + stretch * 0.28, 1 - stretch * 0.15);
        }
      } else if (!p.dead && dogMeshRef.current) {
        dogMeshRef.current.position.x = p.x;
        dogMeshRef.current.position.z = p.z;
      }

      // Rotate dog
      if (dogMeshRef.current && !p.dead) {
        dogMeshRef.current.rotation.y = p.rotation;
      }

      // G. Rotate Coins
      lanesRef.current.forEach((lane) => {
        lane.coins?.forEach((c) => {
          if (!c.collected) {
            c.mesh.rotation.y += dt * 3.0;
          }
        });
      });

      // H. Camera Tracking
      if (cameraRef.current && !p.dead) {
        const targetCamX = p.x - 7.0;
        const targetCamZ = p.z - 4.5;
        cameraRef.current.position.x = THREE.MathUtils.lerp(cameraRef.current.position.x, targetCamX, 0.08);
        cameraRef.current.position.z = THREE.MathUtils.lerp(cameraRef.current.position.z, targetCamZ, 0.08);
        cameraRef.current.lookAt(p.x, 0.5, p.z + 3.0);
      }

      renderer.render(scene, camera);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Resize
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 560;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [resetGame]);

  const currentZoneStyle = ZONE_INFO[currentColorType] || ZONE_INFO.grass;

  return (
    <div className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none">
      {/* 1. Game Top Header HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          {/* Distance / Score */}
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">SCORE</div>
              <div className="text-xl font-black font-mono text-white tracking-wider">{score}</div>
            </div>
          </div>

          <div className="hidden sm:block h-7 w-[1px] bg-slate-800" />

          {/* High Score */}
          <div className="hidden sm:block">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">BEST</div>
            <div className="text-sm font-bold font-mono text-slate-300">{highScore}</div>
          </div>
        </div>

        {/* Center Live Traffic Light HUD Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <span>馬路號誌:</span>
            {currentLaneStatus.isRoad ? (
              <span className="flex items-center gap-1.5 font-bold">
                {currentLaneStatus.lightState === 'red' && (
                  <>
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <span className="text-red-400">🔴 紅燈 (跨越扣 1 金幣)</span>
                  </>
                )}
                {currentLaneStatus.lightState === 'yellow' && (
                  <>
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="text-yellow-400">🟡 黃燈 (安全通行)</span>
                  </>
                )}
                {currentLaneStatus.lightState === 'green' && (
                  <>
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400">🟢 綠燈 (安全通行)</span>
                  </>
                )}
                <span className="text-xs text-slate-500 font-mono">({currentLaneStatus.timeRemaining}s)</span>
              </span>
            ) : (
              <span className="text-slate-500 font-normal">草地 / 安全區域</span>
            )}
          </div>
        </div>

        {/* Right Coins & Audio Controls */}
        <div className="flex items-center gap-3">
          {/* Coins Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono font-bold text-sm shadow-inner">
            <Coins className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>{coins}</span>
            <span className="text-[10px] text-amber-500 font-normal">金幣</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition"
            title={soundEnabled ? '關閉音效' : '開啟音效'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Restart */}
          <button
            onClick={resetGame}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="重新開始"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重置</span>
          </button>
        </div>
      </div>

      {/* 1.5. 20-Second Same Color Area Countdown Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2 bg-slate-900/95 border-b border-slate-800 text-xs z-15 backdrop-blur-sm">
        {/* Current Zone Badge */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">當前顏色區域:</span>
          <span
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs border ${currentZoneStyle.bgColor}`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentZoneStyle.dotColor }}
            />
            <span className={currentZoneStyle.textColor}>{currentZoneStyle.label}</span>
          </span>
        </div>

        {/* 20s Progress Bar & Countdown Timer */}
        <div className="flex items-center gap-2.5 flex-1 max-w-xs sm:max-w-md mx-2">
          <Timer className={`w-3.5 h-3.5 ${colorAreaRemaining <= 5 ? 'text-red-400 animate-spin' : 'text-slate-400'}`} />
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">同色限時:</span>
          <div className="flex-1 h-2.5 rounded-full bg-slate-800/90 overflow-hidden relative border border-slate-700/60 shadow-inner">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                colorAreaRemaining <= 5
                  ? 'bg-red-500 animate-pulse'
                  : colorAreaRemaining <= 10
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (colorAreaRemaining / 20) * 100))}%` }}
            />
          </div>
          <div className="flex items-center gap-1 font-mono font-black text-xs whitespace-nowrap min-w-[58px] text-right">
            <span
              className={`text-sm ${
                colorAreaRemaining <= 5
                  ? 'text-red-400 font-black animate-pulse'
                  : colorAreaRemaining <= 10
                  ? 'text-amber-300'
                  : 'text-emerald-300'
              }`}
            >
              {colorAreaRemaining.toFixed(1)}s
            </span>
            <span className="text-[10px] text-slate-500 font-normal">/ 20s</span>
          </div>
        </div>

        {/* Warning pill if <= 5s */}
        <div className="text-right">
          {colorAreaRemaining <= 5 ? (
            <span className="text-[11px] text-red-400 font-bold animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>即將超時！請快跨至不同顏色！</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 hidden lg:inline">
              ⏳ 停留同一顏色超過 20 秒即失敗
            </span>
          )}
        </div>
      </div>

      {/* 2. Main 3D Canvas Stage */}
      <div
        className="w-full h-[520px] sm:h-[600px] cursor-pointer relative overflow-hidden"
        onClick={() => tryHop(0, 1)} // Tap canvas to hop forward!
      >
        {/* Dedicated Three.js canvas mount - ZERO REACT CHILDREN INSIDE */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full" />

        {/* Floating Notification Banner (Penalty / Safe / Coin) */}
        {floatingNotice && (
          <div
            className={`absolute top-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl text-sm font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-150 flex items-center gap-2 border ${
              floatingNotice.type === 'penalty'
                ? 'bg-red-950/90 border-red-500 text-red-200'
                : floatingNotice.type === 'coin'
                ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
            }`}
          >
            {floatingNotice.type === 'penalty' && <ShieldAlert className="w-4 h-4 text-red-400" />}
            {floatingNotice.type === 'safe' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
            {floatingNotice.type === 'coin' && <Coins className="w-4 h-4 text-amber-400" />}
            <span>{floatingNotice.text}</span>
          </div>
        )}

        {/* Urgent Color Area Timeout Warning Banner (< 5s) */}
        {colorAreaRemaining <= 5 && !isGameOver && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-bold shadow-2xl backdrop-blur-md animate-pulse flex items-center gap-2 pointer-events-none">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
            <span>【{currentZoneStyle.label}】停留警告：剩餘 {colorAreaRemaining.toFixed(1)} 秒！請立即跨出！</span>
          </div>
        )}

        {/* Keyboard Hints Overlay */}
        <div className="absolute top-4 left-4 bg-slate-950/75 border border-slate-800 text-slate-300 text-[11px] px-3 py-1.5 rounded-lg backdrop-blur-md pointer-events-none hidden sm:flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>按 W / ↑ 前進，A/D ← → 轉向，S / ↓ 後退 · 點擊畫面亦可跳躍</span>
        </div>

        {/* Traffic Light & Color Timer Rule Reminder Pill */}
        <div className="absolute top-4 right-4 bg-slate-950/85 border border-slate-800 text-[11px] px-3 py-1.5 rounded-lg backdrop-blur-md pointer-events-none hidden md:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-300">紅燈跨越：</span>
          <span className="text-red-400 font-bold">-1 金幣</span>
          <span className="text-slate-600">|</span>
          <Timer className="w-3 h-3 text-amber-400" />
          <span className="text-slate-300">同色限時：</span>
          <span className="text-amber-300 font-bold">20 秒失敗</span>
        </div>

        {/* 3. Game Over Overlay Screen */}
        {isGameOver && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-center space-y-5">
              <div className="space-y-1">
                <div className="text-xs font-mono text-red-400 uppercase tracking-widest">
                  GAME OVER · 遊戲結束
                </div>
                <h3 className="text-2xl font-black text-white">{gameOverReason}</h3>
                {gameOverReason.includes('20 秒') && (
                  <p className="text-xs text-amber-300 font-medium pt-1">
                    ⚠️ 規則提醒：在同一顏色區域不可逗留超過 20 秒，請持續前進並變換不同顏色地形！
                  </p>
                )}
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-left">
                <div>
                  <div className="text-[11px] text-slate-400">最終得分 (步數)</div>
                  <div className="text-2xl font-black font-mono text-white mt-0.5">{score}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">最高紀錄 (BEST)</div>
                  <div className="text-2xl font-black font-mono text-amber-400 mt-0.5">{highScore}</div>
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400">剩餘金幣</div>
                  <div className="text-base font-bold font-mono text-amber-300 mt-0.5">💰 {coins}</div>
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400">闖紅燈次數</div>
                  <div className="text-base font-bold font-mono text-red-400 mt-0.5">
                    🚨 {redLightViolations} 次 (-{redLightViolations} 金幣)
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
                  <span>安全綠燈通行: <strong className="text-emerald-400">{safeCrossings}</strong> 次</span>
                  <span>拾取金幣: <strong className="text-amber-300">+{totalCoinsCollected}</strong></span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-800/40 flex justify-between text-xs text-slate-400">
                  <span>最後地形: <strong className={currentZoneStyle.textColor}>{currentZoneStyle.label}</strong></span>
                  <span>同色區域限時: <strong className="text-slate-200">20.0 秒</strong></span>
                </div>
              </div>

              {/* Restart Button */}
              <button
                onClick={resetGame}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-bold rounded-xl shadow-lg shadow-red-950/50 transition flex items-center justify-center gap-2 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>再次挑戰 (Play Again)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Controls / Virtual D-Pad for Mobile & Touch */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950/90 border-t border-slate-800 z-10">
        {/* Violation & Safety Stats Summary */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-slate-400">闖紅燈違規:</span>
            <span className="font-mono font-bold text-red-400">{redLightViolations} 次</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">合規綠燈通過:</span>
            <span className="font-mono font-bold text-emerald-400">{safeCrossings} 次</span>
          </div>
        </div>

        {/* Virtual Arrow Hop Keys */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => tryHop(1, 0)}
            className="p-3 bg-slate-800 active:bg-slate-700 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition"
            title="向左跳"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => tryHop(0, 1)}
              className="px-4 py-2 bg-red-600 active:bg-red-700 hover:bg-red-500 text-white font-bold rounded-xl border border-red-500 shadow-md shadow-red-950/40 transition flex items-center gap-1"
              title="向前跳"
            >
              <ArrowUp className="w-4 h-4" />
              <span className="text-xs">HOP!</span>
            </button>
            <button
              onClick={() => tryHop(0, -1)}
              className="p-2 bg-slate-800 active:bg-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition flex items-center justify-center"
              title="向後跳"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => tryHop(-1, 0)}
            className="p-3 bg-slate-800 active:bg-slate-700 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition"
            title="向右跳"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
