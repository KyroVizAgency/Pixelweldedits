import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, SunMedium, Video } from 'lucide-react';

type CameraPreset = 'studio' | 'overShoulder' | 'closeUp';
type LightingMood = 'sapphire' | 'daylight' | 'deepGrade';

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number]; label: string }
> = {
  studio: { pos: [3.2, 2.05, 3.35], target: [0.05, 1.08, -0.1], label: 'Wide Studio' },
  overShoulder: {
    pos: [-1.45, 1.88, 2.15],
    target: [0.1, 1.18, -0.55],
    label: 'Over-Shoulder',
  },
  closeUp: { pos: [1.35, 1.62, 1.75], target: [0.05, 1.32, 0.05], label: 'Character Focus' },
};

const LIGHTING_MOODS: Record<
  LightingMood,
  {
    label: string;
    screenColor: string;
    screenIntensity: number;
    rimColor: string;
    rimIntensity: number;
    hemiSky: string;
    hemiIntensity: number;
  }
> = {
  sapphire: {
    label: 'Sapphire Edit',
    screenColor: '#69B8FF',
    screenIntensity: 3.4,
    rimColor: '#2579DB',
    rimIntensity: 2.6,
    hemiSky: '#5EB7FF',
    hemiIntensity: 0.75,
  },
  daylight: {
    label: 'Cool Studio',
    screenColor: '#CFE8FF',
    screenIntensity: 3.8,
    rimColor: '#60A5FA',
    rimIntensity: 2.2,
    hemiSky: '#A8D0FF',
    hemiIntensity: 1.05,
  },
  deepGrade: {
    label: 'Color Suite',
    screenColor: '#2B85E8',
    screenIntensity: 2.9,
    rimColor: '#1666C5',
    rimIntensity: 3.2,
    hemiSky: '#2D6CC0',
    hemiIntensity: 0.55,
  },
};

// Pre-allocated scratch helpers (zero GC inside animation loop)
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _euler = new THREE.Euler();
const _screenTargetColor = new THREE.Color();
const _rimTargetColor = new THREE.Color();
const _hemiTargetColor = new THREE.Color();

function createRadialShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawNleMonitorCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
) {
  // Deep editorial NLE UI background
  ctx.fillStyle = '#070E1B';
  ctx.fillRect(0, 0, w, h);

  // Top bar
  ctx.fillStyle = '#0D192E';
  ctx.fillRect(0, 0, w, 28);
  ctx.fillStyle = '#5EB7FF';
  ctx.font = '600 12px monospace';
  ctx.fillText('PIXELWELDEDITS · TIMELINE 24FPS', 14, 18);

  // Program preview frame (top center-left)
  const previewX = 16;
  const previewY = 38;
  const previewW = w - 210;
  const previewH = 165;
  const grad = ctx.createLinearGradient(previewX, previewY, previewX + previewW, previewY + previewH);
  grad.addColorStop(0, '#071A3E');
  grad.addColorStop(0.55, '#134A96');
  grad.addColorStop(1, '#091426');
  ctx.fillStyle = grad;
  ctx.fillRect(previewX, previewY, previewW, previewH);

  // Animated light sweep / subject silhouette inside preview monitor
  const sweepX = previewX + ((Math.sin(time * 0.7) * 0.5 + 0.5) * (previewW - 90));
  const glow = ctx.createRadialGradient(
    sweepX + 45,
    previewY + previewH * 0.45,
    8,
    sweepX + 45,
    previewY + previewH * 0.45,
    110
  );
  glow.addColorStop(0, 'rgba(130, 205, 255, 0.85)');
  glow.addColorStop(0.5, 'rgba(56, 152, 236, 0.25)');
  glow.addColorStop(1, 'rgba(7, 14, 27, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(previewX, previewY, previewW, previewH);

  // Cinemascope letterbox bars
  ctx.fillStyle = '#03060C';
  ctx.fillRect(previewX, previewY, previewW, 18);
  ctx.fillRect(previewX, previewY + previewH - 18, previewW, 18);

  // Right inspector / scopes panel
  const panelX = previewX + previewW + 12;
  ctx.fillStyle = '#0B1629';
  ctx.fillRect(panelX, previewY, 166, previewH);
  ctx.strokeStyle = '#1E3561';
  ctx.strokeRect(panelX, previewY, 166, previewH);

  // Lumetri / Color bars
  for (let i = 0; i < 18; i++) {
    const barH = 18 + Math.sin(time * 2.4 + i * 0.65) * 14 + Math.cos(i * 1.1) * 10;
    ctx.fillStyle = i % 3 === 0 ? '#5EB7FF' : i % 3 === 1 ? '#3898EC' : '#1E64C8';
    ctx.fillRect(panelX + 12 + i * 8, previewY + 135 - Math.max(8, barH), 5, Math.max(8, barH));
  }

  // Timeline area
  const tlY = 216;
  ctx.fillStyle = '#091222';
  ctx.fillRect(14, tlY, w - 28, h - tlY - 14);
  ctx.strokeStyle = '#1D3054';
  ctx.strokeRect(14, tlY, w - 28, h - tlY - 14);

  // Video & Audio tracks
  const tracks = [
    { y: tlY + 18, color: '#1666C5', clips: [[22, 110], [138, 92], [236, 140], [382, 100]] },
    { y: tlY + 46, color: '#2983DF', clips: [[50, 82], [180, 120], [320, 130]] },
    { y: tlY + 78, color: '#0F4D92', clips: [[22, 210], [240, 235]] },
  ];

  tracks.forEach((tr, tIdx) => {
    tr.clips.forEach(([cx, cw]) => {
      ctx.fillStyle = tr.color;
      ctx.fillRect(cx, tr.y, cw, 20);
      ctx.strokeStyle = '#5EB7FF';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, tr.y, cw, 20);

      if (tIdx === 2) {
        // Audio waveform ticks
        ctx.fillStyle = '#89CCFF';
        for (let wx = cx + 4; wx < cx + cw - 4; wx += 4) {
          const wh = 4 + Math.abs(Math.sin(wx * 0.18 + time * 1.5)) * 10;
          ctx.fillRect(wx, tr.y + 10 - wh / 2, 2, wh);
        }
      }
    });
  });

  // Moving Playhead
  const playheadX = 24 + ((time * 36) % (w - 56));
  ctx.fillStyle = '#7CE8FF';
  ctx.fillRect(playheadX, tlY + 4, 2, h - tlY - 22);
  ctx.beginPath();
  ctx.moveTo(playheadX - 6, tlY + 4);
  ctx.lineTo(playheadX + 8, tlY + 4);
  ctx.lineTo(playheadX + 1, tlY + 14);
  ctx.closePath();
  ctx.fill();
}

function drawScopeMonitorCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
) {
  ctx.fillStyle = '#060D1A';
  ctx.fillRect(0, 0, w, h);

  // Vectorscope circle
  const cx = w * 0.5;
  const cy = h * 0.34;
  const r = 64;
  ctx.strokeStyle = '#1E3A6A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.stroke();

  // Animated chromatic trace
  ctx.strokeStyle = '#5EB7FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let a = 0; a <= Math.PI * 2; a += 0.2) {
    const rad = r * (0.35 + 0.32 * Math.sin(a * 3 + time * 1.6));
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Lower waveform parade
  const baseY = h - 24;
  for (let i = 0; i < 32; i++) {
    const val = 24 + Math.sin(i * 0.45 + time * 2.2) * 18 + Math.cos(i * 0.9 - time) * 10;
    ctx.fillStyle = i % 2 === 0 ? '#3898EC' : '#85CBFF';
    ctx.fillRect(20 + i * 7.2, baseY - Math.max(8, val), 4, Math.max(8, val));
  }
}

export function EditingSuiteSection() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('studio');
  const [lightingMood, setLightingMood] = useState<LightingMood>('sapphire');
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const cameraPresetRef = useRef<CameraPreset>(cameraPreset);
  const lightingMoodRef = useRef<LightingMood>(lightingMood);
  const transitionActiveRef = useRef<boolean>(false);

  const handleSelectCamera = (preset: CameraPreset) => {
    setCameraPreset(preset);
    cameraPresetRef.current = preset;
    transitionActiveRef.current = true;
  };

  useEffect(() => {
    lightingMoodRef.current = lightingMood;
  }, [lightingMood]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setContextLost(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initW = container.clientWidth || 1200;
    const initH = container.clientHeight || 580;
    renderer.setSize(initW, initH);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#040914');
    scene.fog = new THREE.FogExp2('#040914', 0.085);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(38, initW / initH, 0.1, 45);
    camera.position.set(...CAMERA_PRESETS.studio.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 2.0;
    controls.maxDistance = 6.2;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(...CAMERA_PRESETS.studio.target);

    controls.addEventListener('start', () => {
      transitionActiveRef.current = false;
    });

    // Studio 3-Point + Dynamic Monitor Bounce Lighting
    const hemiLight = new THREE.HemisphereLight('#5EB7FF', '#050A14', 0.75);
    scene.add(hemiLight);

    const studioKey = new THREE.DirectionalLight('#FFEFE0', 1.1);
    studioKey.position.set(3.4, 4.8, 3.2);
    studioKey.castShadow = !isSoftwareGl;
    studioKey.shadow.mapSize.set(1024, 1024);
    studioKey.shadow.camera.left = -3.2;
    studioKey.shadow.camera.right = 3.2;
    studioKey.shadow.camera.top = 3.2;
    studioKey.shadow.camera.bottom = -3.2;
    studioKey.shadow.camera.near = 0.8;
    studioKey.shadow.camera.far = 14;
    studioKey.shadow.bias = -0.0005;
    studioKey.shadow.normalBias = 0.02;
    scene.add(studioKey);

    const rimLight = new THREE.DirectionalLight('#2579DB', 2.6);
    rimLight.position.set(-3.2, 2.8, -2.8);
    scene.add(rimLight);

    // Dynamic monitor illumination hitting the character's face, hoodie, and hands
    const screenBounceLight = new THREE.PointLight('#69B8FF', 3.4, 5.2, 1.5);
    screenBounceLight.position.set(0.05, 1.38, -0.35);
    screenBounceLight.castShadow = !isSoftwareGl;
    screenBounceLight.shadow.bias = -0.001;
    scene.add(screenBounceLight);

    const deskAccentLight = new THREE.PointLight('#3898EC', 1.4, 3.6, 1.6);
    deskAccentLight.position.set(-0.65, 1.12, -0.45);
    scene.add(deskAccentLight);

    const disposables: Array<{ dispose: () => void }> = [];

    // Live Procedural Monitor Textures
    const mainScreenCanvas = document.createElement('canvas');
    mainScreenCanvas.width = 512;
    mainScreenCanvas.height = 340;
    const mainScreenCtx = mainScreenCanvas.getContext('2d')!;
    drawNleMonitorCanvas(mainScreenCtx, 512, 340, 0);
    const mainScreenTex = new THREE.CanvasTexture(mainScreenCanvas);
    mainScreenTex.colorSpace = THREE.SRGBColorSpace;
    mainScreenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const sideScreenCanvas = document.createElement('canvas');
    sideScreenCanvas.width = 256;
    sideScreenCanvas.height = 320;
    const sideScreenCtx = sideScreenCanvas.getContext('2d')!;
    drawScopeMonitorCanvas(sideScreenCtx, 256, 320, 0);
    const sideScreenTex = new THREE.CanvasTexture(sideScreenCanvas);
    sideScreenTex.colorSpace = THREE.SRGBColorSpace;
    sideScreenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const radialShadowTex = createRadialShadowTexture();
    disposables.push(mainScreenTex, sideScreenTex, radialShadowTex);

    // Materials Palette (varied roughness & metalness across adjacent parts)
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#070D19',
      roughness: 0.78,
      metalness: 0.15,
    });
    const studioWallMat = new THREE.MeshStandardMaterial({
      color: '#0A1324',
      roughness: 0.85,
      metalness: 0.08,
    });
    const deskTopMat = new THREE.MeshStandardMaterial({
      color: '#171E2C',
      roughness: 0.42,
      metalness: 0.22,
    });
    const deskMatPadMat = new THREE.MeshStandardMaterial({
      color: '#0B101A',
      roughness: 0.86,
      metalness: 0.04,
    });
    const metalFrameMat = new THREE.MeshStandardMaterial({
      color: '#1E283B',
      roughness: 0.34,
      metalness: 0.88,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: '#A7B8D0',
      roughness: 0.18,
      metalness: 0.95,
    });
    const keycapMat = new THREE.MeshStandardMaterial({
      color: '#141B29',
      roughness: 0.5,
      metalness: 0.2,
    });
    const blueGlowMat = new THREE.MeshStandardMaterial({
      color: '#3898EC',
      emissive: '#3898EC',
      emissiveIntensity: 1.15,
      roughness: 0.25,
      metalness: 0.3,
    });
    const mainScreenMat = new THREE.MeshStandardMaterial({
      map: mainScreenTex,
      emissiveMap: mainScreenTex,
      emissive: new THREE.Color('#FFFFFF'),
      emissiveIntensity: 0.92,
      roughness: 0.14,
      metalness: 0.1,
    });
    const sideScreenMat = new THREE.MeshStandardMaterial({
      map: sideScreenTex,
      emissiveMap: sideScreenTex,
      emissive: new THREE.Color('#FFFFFF'),
      emissiveIntensity: 0.85,
      roughness: 0.14,
      metalness: 0.1,
    });

    // Character Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: '#DFB095',
      roughness: 0.56,
      metalness: 0.02,
    });
    const hoodieMat = new THREE.MeshStandardMaterial({
      color: '#141A26',
      roughness: 0.88,
      metalness: 0.04,
    });
    const hoodieTrimMat = new THREE.MeshStandardMaterial({
      color: '#1E283A',
      roughness: 0.78,
      metalness: 0.08,
    });
    const joggersMat = new THREE.MeshStandardMaterial({
      color: '#0D121B',
      roughness: 0.84,
      metalness: 0.05,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: '#191619',
      roughness: 0.7,
      metalness: 0.08,
    });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: '#F2F6FC',
      roughness: 0.25,
      metalness: 0.0,
    });
    const irisMat = new THREE.MeshPhysicalMaterial({
      color: '#182436',
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const headphoneBodyMat = new THREE.MeshStandardMaterial({
      color: '#1B2230',
      roughness: 0.3,
      metalness: 0.75,
    });
    const headphonePadMat = new THREE.MeshStandardMaterial({
      color: '#0B0F17',
      roughness: 0.72,
      metalness: 0.05,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: '#1D2534',
      roughness: 0.65,
      metalness: 0.1,
    });
    const shoeSoleMat = new THREE.MeshStandardMaterial({
      color: '#DCE6F5',
      roughness: 0.55,
      metalness: 0.05,
    });
    const chairMeshMat = new THREE.MeshStandardMaterial({
      color: '#111724',
      roughness: 0.78,
      metalness: 0.12,
    });

    disposables.push(
      floorMat,
      studioWallMat,
      deskTopMat,
      deskMatPadMat,
      metalFrameMat,
      chromeMat,
      keycapMat,
      blueGlowMat,
      mainScreenMat,
      sideScreenMat,
      skinMat,
      hoodieMat,
      hoodieTrimMat,
      joggersMat,
      hairMat,
      eyeWhiteMat,
      irisMat,
      headphoneBodyMat,
      headphonePadMat,
      shoeMat,
      shoeSoleMat,
      chairMeshMat
    );

    // 1. Studio Plinth Floor & Acoustic Back Backdrop
    const floorGeo = new THREE.CylinderGeometry(5.5, 5.8, 0.12, 64);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.06;
    floor.receiveShadow = true;
    scene.add(floor);
    disposables.push(floorGeo);

    // Soft contact shadow under desk & chair
    const shadowGeo = new THREE.PlaneGeometry(4.4, 3.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: radialShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.01, -0.1);
    scene.add(contactShadow);
    disposables.push(shadowGeo, shadowMat);

    // Acoustic wall slats behind desk
    const wallGroup = new THREE.Group();
    wallGroup.position.set(0, 0, -1.35);
    scene.add(wallGroup);

    const wallPanelGeo = new THREE.BoxGeometry(3.6, 2.35, 0.08);
    const wallPanel = new THREE.Mesh(wallPanelGeo, studioWallMat);
    wallPanel.position.y = 1.18;
    wallPanel.receiveShadow = true;
    wallGroup.add(wallPanel);
    disposables.push(wallPanelGeo);

    const slatGeo = new THREE.BoxGeometry(0.055, 2.15, 0.035);
    const slatCount = 26;
    const slats = new THREE.InstancedMesh(slatGeo, deskTopMat, slatCount);
    for (let i = 0; i < slatCount; i++) {
      _pos.set(-1.62 + i * 0.13, 1.18, 0.055);
      _quat.identity();
      _mat4.compose(_pos, _quat, _scale);
      slats.setMatrixAt(i, _mat4);
    }
    slats.computeBoundingSphere();
    wallGroup.add(slats);
    disposables.push(slatGeo);

    // LED light bar accent under acoustic wall shelf
    const wallLedGeo = new THREE.BoxGeometry(2.6, 0.025, 0.025);
    const wallLed = new THREE.Mesh(wallLedGeo, blueGlowMat);
    wallLed.position.set(0, 1.92, 0.08);
    wallGroup.add(wallLed);
    disposables.push(wallLedGeo);

    // 2. Modern PC Editing Desk (grounded at y = 0)
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, 0, -0.58);
    scene.add(deskGroup);

    // Beveled tabletop at y = 0.76
    const deskTopShape = new THREE.Shape();
    const dw = 1.18;
    const dd = 0.44;
    deskTopShape.moveTo(-dw, -dd);
    deskTopShape.lineTo(dw, -dd);
    deskTopShape.lineTo(dw, dd);
    deskTopShape.lineTo(-dw, dd);
    deskTopShape.closePath();

    const deskTopGeo = new THREE.ExtrudeGeometry(deskTopShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 3,
    });
    deskTopGeo.rotateX(Math.PI / 2);
    const deskTop = new THREE.Mesh(deskTopGeo, deskTopMat);
    deskTop.position.y = 0.78;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);
    disposables.push(deskTopGeo);

    // Steel desk legs
    const legGeo = new THREE.BoxGeometry(0.06, 0.74, 0.06);
    const footGeo = new THREE.BoxGeometry(0.08, 0.035, 0.72);
    [-1.02, 1.02].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, metalFrameMat);
      leg.position.set(lx, 0.38, 0);
      leg.castShadow = true;
      deskGroup.add(leg);

      const foot = new THREE.Mesh(footGeo, metalFrameMat);
      foot.position.set(lx, 0.0175, 0);
      foot.castShadow = true;
      deskGroup.add(foot);
    });
    disposables.push(legGeo, footGeo);

    // Extended desk mat
    const matGeo = new THREE.BoxGeometry(1.18, 0.008, 0.44);
    const deskMat = new THREE.Mesh(matGeo, deskMatPadMat);
    deskMat.position.set(0.02, 0.796, 0.14);
    deskMat.receiveShadow = true;
    deskGroup.add(deskMat);
    disposables.push(matGeo);

    // Mechanical Keyboard (angled slightly toward character)
    const kbGroup = new THREE.Group();
    kbGroup.position.set(-0.08, 0.812, 0.17);
    kbGroup.rotation.y = 0.06;
    deskGroup.add(kbGroup);

    const kbBaseGeo = new THREE.BoxGeometry(0.42, 0.022, 0.15);
    const kbBase = new THREE.Mesh(kbBaseGeo, metalFrameMat);
    kbBase.castShadow = true;
    kbGroup.add(kbBase);
    disposables.push(kbBaseGeo);

    const kbGlowGeo = new THREE.BoxGeometry(0.41, 0.006, 0.14);
    const kbGlow = new THREE.Mesh(kbGlowGeo, blueGlowMat);
    kbGlow.position.y = 0.011;
    kbGroup.add(kbGlow);
    disposables.push(kbGlowGeo);

    const keyGeo = new THREE.BoxGeometry(0.022, 0.012, 0.022);
    const keyRows = 4;
    const keyCols = 13;
    const keysInst = new THREE.InstancedMesh(keyGeo, keycapMat, keyRows * keyCols);
    let kIdx = 0;
    for (let r = 0; r < keyRows; r++) {
      for (let c = 0; c < keyCols; c++) {
        _pos.set(-0.175 + c * 0.029, 0.017, -0.045 + r * 0.029);
        _quat.identity();
        _mat4.compose(_pos, _quat, _scale);
        keysInst.setMatrixAt(kIdx++, _mat4);
      }
    }
    keysInst.computeBoundingSphere();
    kbGroup.add(keysInst);
    disposables.push(keyGeo);

    // Wireless Precision Mouse (right side of desk pad)
    const mouseGroup = new THREE.Group();
    mouseGroup.position.set(0.32, 0.81, 0.17);
    deskGroup.add(mouseGroup);

    const mouseBodyGeo = new THREE.SphereGeometry(0.044, 24, 16);
    mouseBodyGeo.scale(0.85, 0.48, 1.42);
    const mouseMesh = new THREE.Mesh(mouseBodyGeo, metalFrameMat);
    mouseMesh.castShadow = true;
    mouseGroup.add(mouseMesh);

    const scrollWheelGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.006, 16);
    scrollWheelGeo.rotateZ(Math.PI / 2);
    const scrollWheel = new THREE.Mesh(scrollWheelGeo, blueGlowMat);
    scrollWheel.position.set(0, 0.016, -0.022);
    mouseGroup.add(scrollWheel);
    disposables.push(mouseBodyGeo, scrollWheelGeo);

    // Studio Reference Monitors (Speakers flanking the desk)
    const spkGeo = new THREE.BoxGeometry(0.18, 0.27, 0.2);
    const wooferGeo = new THREE.TorusGeometry(0.045, 0.01, 12, 24);
    [-0.94, 0.94].forEach((sx, idx) => {
      const spk = new THREE.Mesh(spkGeo, metalFrameMat);
      spk.position.set(sx, 0.925, -0.18);
      spk.rotation.y = idx === 0 ? 0.28 : -0.28;
      spk.castShadow = true;
      deskGroup.add(spk);

      const woofer = new THREE.Mesh(wooferGeo, chromeMat);
      woofer.position.set(0, -0.03, 0.102);
      spk.add(woofer);
    });
    disposables.push(spkGeo, wooferGeo);

    // Dual Monitor Arm + Primary Widescreen Monitor + Angled Scope Monitor
    const armStandGeo = new THREE.CylinderGeometry(0.028, 0.034, 0.42, 20);
    const armStand = new THREE.Mesh(armStandGeo, chromeMat);
    armStand.position.set(0, 1.0, -0.34);
    deskGroup.add(armStand);
    disposables.push(armStandGeo);

    // Primary Monitor (center-right)
    const mainMonitor = new THREE.Group();
    mainMonitor.position.set(0.14, 1.19, -0.22);
    mainMonitor.rotation.y = -0.06;
    deskGroup.add(mainMonitor);

    const mainBezelGeo = new THREE.BoxGeometry(0.96, 0.56, 0.035);
    const mainBezel = new THREE.Mesh(mainBezelGeo, metalFrameMat);
    mainBezel.castShadow = true;
    mainMonitor.add(mainBezel);

    const mainDisplayGeo = new THREE.PlaneGeometry(0.92, 0.52);
    const mainDisplay = new THREE.Mesh(mainDisplayGeo, mainScreenMat);
    mainDisplay.position.z = 0.019;
    mainMonitor.add(mainDisplay);
    disposables.push(mainBezelGeo, mainDisplayGeo);

    // Secondary Vertical/Angled Color Scope Monitor (left)
    const sideMonitor = new THREE.Group();
    sideMonitor.position.set(-0.58, 1.2, -0.12);
    sideMonitor.rotation.y = 0.42;
    deskGroup.add(sideMonitor);

    const sideBezelGeo = new THREE.BoxGeometry(0.42, 0.54, 0.035);
    const sideBezel = new THREE.Mesh(sideBezelGeo, metalFrameMat);
    sideBezel.castShadow = true;
    sideMonitor.add(sideBezel);

    const sideDisplayGeo = new THREE.PlaneGeometry(0.38, 0.5);
    const sideDisplay = new THREE.Mesh(sideDisplayGeo, sideScreenMat);
    sideDisplay.position.z = 0.019;
    sideMonitor.add(sideDisplay);
    disposables.push(sideBezelGeo, sideDisplayGeo);

    // Small matte ceramic coffee mug on left side of desk
    const mugGeo = new THREE.CylinderGeometry(0.042, 0.038, 0.095, 24);
    const mug = new THREE.Mesh(mugGeo, hoodieTrimMat);
    mug.position.set(-0.62, 0.838, 0.18);
    mug.castShadow = true;
    deskGroup.add(mug);
    disposables.push(mugGeo);

    // 3. Ergonomic Studio Chair (grounded at y = 0)
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 0.16);
    scene.add(chairGroup);

    const stemGeo = new THREE.CylinderGeometry(0.032, 0.036, 0.38, 20);
    const stem = new THREE.Mesh(stemGeo, chromeMat);
    stem.position.y = 0.24;
    chairGroup.add(stem);

    const starLegGeo = new THREE.BoxGeometry(0.035, 0.03, 0.34);
    const wheelGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.022, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const legPivot = new THREE.Group();
      legPivot.rotation.y = a;
      const leg = new THREE.Mesh(starLegGeo, chromeMat);
      leg.position.set(0, 0.055, 0.17);
      legPivot.add(leg);
      const wheel = new THREE.Mesh(wheelGeo, headphonePadMat);
      wheel.position.set(0, 0.025, 0.32);
      legPivot.add(wheel);
      chairGroup.add(legPivot);
    }

    const seatGeo = new THREE.BoxGeometry(0.54, 0.09, 0.5);
    const seat = new THREE.Mesh(seatGeo, chairMeshMat);
    seat.position.set(0, 0.46, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    chairGroup.add(seat);

    const backrestGeo = new THREE.BoxGeometry(0.48, 0.66, 0.075);
    const backrest = new THREE.Mesh(backrestGeo, chairMeshMat);
    backrest.position.set(0, 0.86, 0.24);
    backrest.rotation.x = 0.08;
    backrest.castShadow = true;
    chairGroup.add(backrest);

    const armrestPostGeo = new THREE.BoxGeometry(0.035, 0.22, 0.04);
    const armrestPadGeo = new THREE.BoxGeometry(0.065, 0.03, 0.26);
    [-0.3, 0.3].forEach((ax) => {
      const post = new THREE.Mesh(armrestPostGeo, metalFrameMat);
      post.position.set(ax, 0.56, 0.02);
      chairGroup.add(post);
      const pad = new THREE.Mesh(armrestPadGeo, headphonePadMat);
      pad.position.set(ax, 0.67, 0);
      chairGroup.add(pad);
    });
    disposables.push(stemGeo, starLegGeo, wheelGeo, seatGeo, backrestGeo, armrestPostGeo, armrestPadGeo);

    // 4. Articulated Young Video Editor Mascot (Seated at Desk)
    const characterRoot = new THREE.Group();
    characterRoot.position.set(0, 0.5, 0.14);
    // Face toward desk (-Z)
    characterRoot.rotation.y = Math.PI;
    scene.add(characterRoot);

    // Seated Pelvis & Legs
    const pelvisGeo = new THREE.SphereGeometry(0.175, 24, 18);
    pelvisGeo.scale(1.15, 0.65, 0.9);
    const pelvis = new THREE.Mesh(pelvisGeo, joggersMat);
    pelvis.position.set(0, 0.04, 0);
    pelvis.castShadow = true;
    characterRoot.add(pelvis);

    const thighGeo = new THREE.CapsuleGeometry(0.076, 0.26, 8, 16);
    const shinGeo = new THREE.CapsuleGeometry(0.062, 0.28, 8, 16);
    const shoeGeo = new THREE.BoxGeometry(0.1, 0.07, 0.22);
    const soleGeo = new THREE.BoxGeometry(0.106, 0.024, 0.23);

    [-0.125, 0.125].forEach((lx, idx) => {
      const thigh = new THREE.Mesh(thighGeo, joggersMat);
      thigh.position.set(lx, 0.04, 0.19);
      thigh.rotation.x = Math.PI / 2 - 0.08;
      thigh.rotation.z = idx === 0 ? -0.06 : 0.06;
      thigh.castShadow = true;
      characterRoot.add(thigh);

      const shin = new THREE.Mesh(shinGeo, joggersMat);
      shin.position.set(lx * 1.15, -0.22, 0.36);
      shin.rotation.x = 0.06;
      shin.castShadow = true;
      characterRoot.add(shin);

      const shoe = new THREE.Mesh(shoeGeo, shoeMat);
      shoe.position.set(lx * 1.15, -0.445, 0.42);
      shoe.castShadow = true;
      characterRoot.add(shoe);

      const sole = new THREE.Mesh(soleGeo, shoeSoleMat);
      sole.position.set(lx * 1.15, -0.475, 0.42);
      characterRoot.add(sole);
    });
    disposables.push(pelvisGeo, thighGeo, shinGeo, shoeGeo, soleGeo);

    // Spine / Torso Pivot (for natural breathing, lean, and subtle groove sway)
    const spinePivot = new THREE.Group();
    spinePivot.position.set(0, 0.1, -0.02);
    characterRoot.add(spinePivot);

    // Oversized Dark Hoodie Torso (sculpted Lathe profile)
    const torsoProfile = [
      new THREE.Vector2(0.01, 0.0),
      new THREE.Vector2(0.21, 0.03),
      new THREE.Vector2(0.225, 0.16),
      new THREE.Vector2(0.205, 0.36),
      new THREE.Vector2(0.22, 0.46),
      new THREE.Vector2(0.12, 0.51),
      new THREE.Vector2(0.01, 0.52),
    ];
    const torsoGeo = new THREE.LatheGeometry(torsoProfile, 32);
    torsoGeo.scale(1.06, 1, 0.78);
    const torsoMesh = new THREE.Mesh(torsoGeo, hoodieMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    spinePivot.add(torsoMesh);

    // Hoodie Kangaroo Pocket & Draped Collar Hood
    const pocketGeo = new THREE.BoxGeometry(0.26, 0.12, 0.06);
    const pocket = new THREE.Mesh(pocketGeo, hoodieTrimMat);
    pocket.position.set(0, 0.14, 0.155);
    spinePivot.add(pocket);

    const hoodCollarGeo = new THREE.TorusGeometry(0.135, 0.045, 16, 32);
    hoodCollarGeo.rotateX(Math.PI / 2 + 0.18);
    const hoodCollar = new THREE.Mesh(hoodCollarGeo, hoodieTrimMat);
    hoodCollar.position.set(0, 0.505, -0.025);
    hoodCollar.castShadow = true;
    spinePivot.add(hoodCollar);

    // Back draped hood fold
    const hoodBackGeo = new THREE.SphereGeometry(0.14, 20, 16);
    hoodBackGeo.scale(1.05, 0.75, 0.65);
    const hoodBack = new THREE.Mesh(hoodBackGeo, hoodieMat);
    hoodBack.position.set(0, 0.44, -0.155);
    hoodBack.castShadow = true;
    spinePivot.add(hoodBack);

    // Hoodie drawstrings
    const stringCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.04, 0.48, 0.11),
      new THREE.Vector3(-0.045, 0.38, 0.165),
      new THREE.Vector3(-0.04, 0.31, 0.17),
    ]);
    const stringCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.04, 0.48, 0.11),
      new THREE.Vector3(0.045, 0.38, 0.165),
      new THREE.Vector3(0.04, 0.31, 0.17),
    ]);
    const stringGeoL = new THREE.TubeGeometry(stringCurveL, 10, 0.006, 8, false);
    const stringGeoR = new THREE.TubeGeometry(stringCurveR, 10, 0.006, 8, false);
    spinePivot.add(new THREE.Mesh(stringGeoL, chromeMat));
    spinePivot.add(new THREE.Mesh(stringGeoR, chromeMat));
    disposables.push(torsoGeo, pocketGeo, hoodCollarGeo, hoodBackGeo, stringGeoL, stringGeoR);

    // Neck & Head Pivot
    const neckGeo = new THREE.CylinderGeometry(0.058, 0.066, 0.12, 20);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 0.54, 0.01);
    spinePivot.add(neckMesh);
    disposables.push(neckGeo);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.66, 0.02);
    spinePivot.add(headPivot);

    // Sculpted Semi-Realistic Head + Jawline
    const craniumGeo = new THREE.SphereGeometry(0.142, 32, 24);
    craniumGeo.scale(0.92, 1.06, 0.98);
    const cranium = new THREE.Mesh(craniumGeo, skinMat);
    cranium.castShadow = true;
    cranium.receiveShadow = true;
    headPivot.add(cranium);

    const jawGeo = new THREE.SphereGeometry(0.102, 24, 18);
    jawGeo.scale(0.86, 0.78, 0.88);
    const jaw = new THREE.Mesh(jawGeo, skinMat);
    jaw.position.set(0, -0.058, 0.032);
    headPivot.add(jaw);

    const noseGeo = new THREE.ConeGeometry(0.018, 0.052, 12);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, -0.005, 0.142);
    nose.rotation.x = Math.PI * 0.36;
    headPivot.add(nose);

    // Eyes + Expressive Blinks + Brows
    const eyeScleraGeo = new THREE.SphereGeometry(0.021, 16, 12);
    const eyeIrisGeo = new THREE.SphereGeometry(0.013, 16, 12);
    const browGeo = new THREE.BoxGeometry(0.044, 0.011, 0.014);
    const eyelidGeo = new THREE.SphereGeometry(0.0225, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);

    const eyelids: THREE.Mesh[] = [];
    [-0.048, 0.048].forEach((ex, idx) => {
      const sclera = new THREE.Mesh(eyeScleraGeo, eyeWhiteMat);
      sclera.position.set(ex, 0.02, 0.122);
      headPivot.add(sclera);

      const iris = new THREE.Mesh(eyeIrisGeo, irisMat);
      iris.position.set(ex, 0.02, 0.132);
      headPivot.add(iris);

      const lid = new THREE.Mesh(eyelidGeo, skinMat);
      lid.position.set(ex, 0.021, 0.122);
      lid.rotation.x = -Math.PI * 0.38;
      headPivot.add(lid);
      eyelids.push(lid);

      const brow = new THREE.Mesh(browGeo, hairMat);
      brow.position.set(ex, 0.056, 0.128);
      brow.rotation.z = idx === 0 ? 0.07 : -0.07;
      headPivot.add(brow);
    });

    // Subtle calm focused smile mouth line
    const mouthGeo = new THREE.TorusGeometry(0.024, 0.0045, 8, 16, Math.PI * 0.68);
    const mouth = new THREE.Mesh(mouthGeo, hoodieTrimMat);
    mouth.position.set(0, -0.054, 0.126);
    mouth.rotation.z = Math.PI * 1.16;
    headPivot.add(mouth);

    // Modern Textured Hair Volume
    const hairCrownGeo = new THREE.SphereGeometry(0.148, 28, 20);
    hairCrownGeo.scale(0.96, 0.92, 1.02);
    const hairCrown = new THREE.Mesh(hairCrownGeo, hairMat);
    hairCrown.position.set(0, 0.042, -0.018);
    hairCrown.castShadow = true;
    headPivot.add(hairCrown);

    const fringeGeo = new THREE.CapsuleGeometry(0.036, 0.085, 6, 12);
    [-0.05, 0, 0.055].forEach((fx, i) => {
      const lock = new THREE.Mesh(fringeGeo, hairMat);
      lock.position.set(fx, 0.125 - i * 0.005, 0.088);
      lock.rotation.z = Math.PI / 2 + (i - 1) * 0.28;
      lock.rotation.x = 0.45;
      headPivot.add(lock);
    });

    // Over-Ear Studio Headphones on Head Pivot
    const headbandCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.152, 0.015, 0),
      new THREE.Vector3(-0.135, 0.145, -0.005),
      new THREE.Vector3(0, 0.195, -0.01),
      new THREE.Vector3(0.135, 0.145, -0.005),
      new THREE.Vector3(0.152, 0.015, 0),
    ]);
    const headbandGeo = new THREE.TubeGeometry(headbandCurve, 24, 0.018, 12, false);
    const headband = new THREE.Mesh(headbandGeo, headphoneBodyMat);
    headband.castShadow = true;
    headPivot.add(headband);

    const earcupGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.042, 24);
    earcupGeo.rotateZ(Math.PI / 2);
    const earpadGeo = new THREE.TorusGeometry(0.052, 0.018, 12, 24);
    earpadGeo.rotateY(Math.PI / 2);
    const cupRingGeo = new THREE.TorusGeometry(0.042, 0.0045, 10, 24);
    cupRingGeo.rotateY(Math.PI / 2);

    [-1, 1].forEach((side) => {
      const cup = new THREE.Mesh(earcupGeo, headphoneBodyMat);
      cup.position.set(side * 0.158, 0.005, 0);
      cup.castShadow = true;
      headPivot.add(cup);

      const pad = new THREE.Mesh(earpadGeo, headphonePadMat);
      pad.position.set(side * 0.14, 0.005, 0);
      headPivot.add(pad);

      const ring = new THREE.Mesh(cupRingGeo, blueGlowMat);
      ring.position.set(side * 0.181, 0.005, 0);
      headPivot.add(ring);
    });

    disposables.push(
      craniumGeo,
      jawGeo,
      noseGeo,
      eyeScleraGeo,
      eyeIrisGeo,
      browGeo,
      eyelidGeo,
      mouthGeo,
      hairCrownGeo,
      fringeGeo,
      headbandGeo,
      earcupGeo,
      earpadGeo,
      cupRingGeo
    );

    // 5. Articulated Arms & Hands (Oversized Hoodie Sleeves + Sculpted Hands)
    const upperArmGeo = new THREE.CapsuleGeometry(0.068, 0.22, 8, 16);
    const forearmGeo = new THREE.CapsuleGeometry(0.062, 0.2, 8, 16);
    const cuffGeo = new THREE.TorusGeometry(0.052, 0.016, 10, 20);
    cuffGeo.rotateX(Math.PI / 2);
    const palmGeo = new THREE.BoxGeometry(0.068, 0.026, 0.075);
    const fingerGeo = new THREE.CapsuleGeometry(0.0085, 0.032, 4, 8);

    const buildArm = (side: -1 | 1) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.23, 0.43, 0.01);
      spinePivot.add(shoulder);

      const upper = new THREE.Mesh(upperArmGeo, hoodieMat);
      upper.position.set(0, -0.13, 0.04);
      upper.rotation.x = -0.35;
      upper.castShadow = true;
      shoulder.add(upper);

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.25, 0.09);
      shoulder.add(elbow);

      const fore = new THREE.Mesh(forearmGeo, hoodieMat);
      fore.position.set(0, 0, 0.14);
      fore.rotation.x = Math.PI / 2;
      fore.castShadow = true;
      elbow.add(fore);

      const cuff = new THREE.Mesh(cuffGeo, hoodieTrimMat);
      cuff.position.set(0, 0, 0.25);
      elbow.add(cuff);

      const hand = new THREE.Group();
      hand.position.set(0, -0.005, 0.29);
      elbow.add(hand);

      const palm = new THREE.Mesh(palmGeo, skinMat);
      palm.castShadow = true;
      hand.add(palm);

      const fingers: THREE.Mesh[] = [];
      for (let f = 0; f < 4; f++) {
        const finger = new THREE.Mesh(fingerGeo, skinMat);
        finger.position.set(-0.022 + f * 0.015, -0.008, 0.045);
        finger.rotation.x = Math.PI / 2 + 0.32;
        hand.add(finger);
        fingers.push(finger);
      }

      return { shoulder, elbow, hand, fingers };
    };

    // Note: characterRoot is rotated PI around Y, so +X in character space is character's LEFT (world -X)
    const leftArm = buildArm(1);
    const rightArm = buildArm(-1);

    disposables.push(upperArmGeo, forearmGeo, cuffGeo, palmGeo, fingerGeo);

    // WebGL Context Loss Guard
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(entry.contentRect.width, 1);
        const h = Math.max(entry.contentRect.height, 1);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    let lastMonitorPaint = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();

      // 1. Update live monitor textures (~24fps cadence for editorial cinema authenticity & performance)
      if (t - lastMonitorPaint > 0.042) {
        lastMonitorPaint = t;
        drawNleMonitorCanvas(mainScreenCtx, 512, 340, t);
        mainScreenTex.needsUpdate = true;
        drawScopeMonitorCanvas(sideScreenCtx, 256, 320, t);
        sideScreenTex.needsUpdate = true;
      }

      // 2. Interactive Lighting Mood & Subtle Screen Luminance Modulation
      const mood = LIGHTING_MOODS[lightingMoodRef.current];
      const screenPulse =
        0.92 + Math.sin(t * 2.1) * 0.06 + Math.sin(t * 5.7) * 0.03;

      _screenTargetColor.set(mood.screenColor);
      _rimTargetColor.set(mood.rimColor);
      _hemiTargetColor.set(mood.hemiSky);

      screenBounceLight.color.lerp(_screenTargetColor, 1 - Math.exp(-5 * dt));
      screenBounceLight.intensity = THREE.MathUtils.damp(
        screenBounceLight.intensity,
        mood.screenIntensity * screenPulse,
        6,
        dt
      );
      rimLight.color.lerp(_rimTargetColor, 1 - Math.exp(-5 * dt));
      rimLight.intensity = THREE.MathUtils.damp(rimLight.intensity, mood.rimIntensity, 6, dt);
      hemiLight.color.lerp(_hemiTargetColor, 1 - Math.exp(-5 * dt));
      hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, mood.hemiIntensity, 6, dt);

      // 3. Seamless Character Animation (Breathing, Music Groove, Head Glances, Typing & Mouse)
      if (!reducedMotion) {
        // Natural relaxed breathing & posture adjustments
        const breathe = Math.sin(t * 1.45) * 0.012;
        const postureLean = Math.sin(t * 0.35) * 0.035;
        const shoulderSway = Math.cos(t * 0.55) * 0.025;

        spinePivot.position.y = 0.1 + breathe;
        spinePivot.rotation.x = 0.12 + postureLean;
        spinePivot.rotation.z = shoulderSway;

        // Occasional music-enjoying head nod blended with screen-scanning glances
        const nodWindow = Math.max(0, Math.sin(t * 0.42)); // periodic groove moments
        const musicNod = Math.sin(t * 4.4) * 0.065 * nodWindow;
        const monitorGlance = Math.sin(t * 0.65) * 0.18 + Math.sin(t * 0.25) * 0.08;

        headPivot.rotation.x = 0.06 + musicNod - postureLean * 0.6;
        headPivot.rotation.y = monitorGlance;
        headPivot.rotation.z = Math.sin(t * 0.85) * 0.04;

        // Natural eye blink every ~4 seconds
        const blinkCycle = t % 4.1;
        const isBlinking = blinkCycle > 3.92;
        eyelids.forEach((lid) => {
          lid.rotation.x = THREE.MathUtils.damp(
            lid.rotation.x,
            isBlinking ? 0.18 : -Math.PI * 0.38,
            28,
            dt
          );
        });

        // Left Arm: Continuous natural typing across keyboard home row
        const leftShift = Math.sin(t * 1.9) * 0.06;
        leftArm.shoulder.rotation.x = -0.22 + Math.sin(t * 2.2) * 0.03;
        leftArm.shoulder.rotation.y = -0.14 + leftShift;
        leftArm.shoulder.rotation.z = -0.12;
        leftArm.elbow.rotation.x = -0.25 + Math.sin(t * 6.5) * 0.025;
        leftArm.hand.rotation.x = Math.sin(t * 8.4) * 0.08;

        leftArm.fingers.forEach((finger, fIdx) => {
          finger.rotation.x =
            Math.PI / 2 + 0.3 + Math.sin(t * 12.5 + fIdx * 1.45) * 0.18;
        });

        // Right Arm: Smoothly alternates between operating the mouse & typing on keyboard!
        const transitionWave = THREE.MathUtils.smoothstep(
          Math.sin(t * 0.48),
          -0.35,
          0.35
        );
        // 0 = mouse posture, 1 = keyboard posture
        const rightShoulderY = THREE.MathUtils.lerp(0.24, 0.02, transitionWave);
        const mouseGlide = (1 - transitionWave) * Math.sin(t * 2.7) * 0.055;
        const mouseSweep = (1 - transitionWave) * Math.cos(t * 1.6) * 0.035;

        rightArm.shoulder.rotation.x = -0.2 + mouseSweep;
        rightArm.shoulder.rotation.y = rightShoulderY + mouseGlide;
        rightArm.shoulder.rotation.z = 0.12;
        rightArm.elbow.rotation.x =
          -0.24 + transitionWave * Math.sin(t * 6.8) * 0.025;
        rightArm.hand.rotation.x =
          transitionWave * Math.sin(t * 9.1) * 0.07 +
          (1 - transitionWave) * 0.05;

        rightArm.fingers.forEach((finger, fIdx) => {
          const typingTap = Math.sin(t * 13.0 + fIdx * 1.7) * 0.18;
          const mouseClick = fIdx === 1 ? Math.max(0, Math.sin(t * 3.4)) * 0.12 : 0;
          finger.rotation.x =
            Math.PI / 2 + 0.28 + THREE.MathUtils.lerp(mouseClick, typingTap, transitionWave);
        });

        // Sync physical mouse subtly with hand when operating mouse
        mouseGroup.position.x = 0.32 - mouseGlide * 0.45;
        mouseGroup.position.z = 0.17 - mouseSweep * 0.4;
      }

      // 4. Damped Camera Preset Transitions (yields immediately on user orbit drag)
      if (transitionActiveRef.current) {
        const preset = CAMERA_PRESETS[cameraPresetRef.current];
        _camGoalPos.set(...preset.pos);
        _camGoalTarget.set(...preset.target);

        const alpha = 1 - Math.exp(-5.5 * dt);
        camera.position.lerp(_camGoalPos, alpha);
        controls.target.lerp(_camGoalTarget, alpha);

        if (
          camera.position.distanceTo(_camGoalPos) < 0.015 &&
          controls.target.distanceTo(_camGoalTarget) < 0.015
        ) {
          transitionActiveRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      envTarget.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section
      id="studio-mascot"
      aria-label="Interactive 3D Editing Suite"
      className="relative border-b border-[#1D3054]/70 bg-[#040914] py-16 lg:py-22"
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        {/* Clean Editorial Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium tracking-wider text-[#5EB7FF]">
              Inside the Edit Suite
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F4F7FC] sm:text-4xl">
              Where every frame is assembled in real time.
            </h2>
          </div>

          <p className="max-w-md text-xs leading-relaxed text-[#8FA3C4] sm:text-sm">
            Drag to orbit around the workstation, scroll to zoom, or shift camera angles and
            monitor lighting below.
          </p>
        </div>

        {/* Full-Width Interactive 3D Viewport */}
        <div
          data-cursor="stage"
          className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-[#1D3054] bg-[#040914] sm:h-[560px] lg:h-[620px]"
        >
          <div
            ref={mountRef}
            className="h-full w-full"
            aria-label="3D animated video editor working at dual-monitor PC workstation"
          />

          {contextLost && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#040914] p-6 text-center">
              <p className="text-sm text-[#8FA3C4]">
                3D studio viewport paused — reload to restore interactive workstation view.
              </p>
            </div>
          )}

          {/* Top-Left Static Specification Caption */}
          <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-[#8FA3C4]">
            <span className="font-mono tracking-wider uppercase text-[#5EB7FF]">
              Suite 01 · {LIGHTING_MOODS[lightingMood].label}
            </span>
            <span className="hidden font-mono sm:inline">
              Drag to orbit · Scroll to zoom
            </span>
          </div>

          {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion, solid/rgba over WebGL) */}
          <div className="absolute bottom-4 left-1/2 z-10 flex w-[calc(100%-24px)] max-w-[740px] -translate-x-1/2 flex-col items-center">
            <button
              type="button"
              onClick={() => setControlsCollapsed((v) => !v)}
              className="mb-1.5 inline-flex items-center gap-1.5 rounded-md border border-[#1D3054] bg-[#0B1528]/95 px-3 py-1 text-[11px] font-medium text-[#8FA3C4] transition-colors hover:border-[#3898EC] hover:text-[#F4F7FC]"
            >
              {controlsCollapsed ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Show Suite Controls</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Hide Controls</span>
                </>
              )}
            </button>

            {!controlsCollapsed && (
              <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1D3054] bg-[#0B1528]/95 p-2 shadow-xl">
                <div
                  className="flex flex-wrap items-center gap-1"
                  role="group"
                  aria-label="Camera angles"
                >
                  <span className="mr-1 hidden items-center gap-1 pl-1.5 text-[11px] text-[#8FA3C4] sm:inline-flex">
                    <Video className="h-3.5 w-3.5 text-[#5EB7FF]" />
                  </span>
                  {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectCamera(key)}
                      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        cameraPreset === key
                          ? 'bg-[#1666C5] text-white'
                          : 'text-[#8FA3C4] hover:bg-[#101E38] hover:text-[#F4F7FC]'
                      }`}
                    >
                      {CAMERA_PRESETS[key].label}
                    </button>
                  ))}
                </div>

                <div
                  className="flex flex-wrap items-center gap-1"
                  role="group"
                  aria-label="Interactive monitor lighting"
                >
                  <span className="mr-1 hidden items-center gap-1 pl-1.5 text-[11px] text-[#8FA3C4] sm:inline-flex">
                    <SunMedium className="h-3.5 w-3.5 text-[#5EB7FF]" />
                  </span>
                  {(Object.keys(LIGHTING_MOODS) as LightingMood[]).map((moodKey) => (
                    <button
                      key={moodKey}
                      type="button"
                      onClick={() => setLightingMood(moodKey)}
                      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        lightingMood === moodKey
                          ? 'bg-[#3898EC] text-[#050A14]'
                          : 'border border-[#1D3054] bg-[#101E38] text-[#F4F7FC] hover:border-[#3898EC]'
                      }`}
                    >
                      {LIGHTING_MOODS[moodKey].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
