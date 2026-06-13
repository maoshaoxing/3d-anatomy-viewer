import React, { Suspense, useRef, useState, useCallback, useEffect, Component } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import {
  OrbitControls,
  useGLTF,
  Environment,
  ContactShadows,
  Grid,
  Html,
  useProgress,
  Edges,
} from '@react-three/drei';
import * as THREE from 'three';
import type { SceneFeatures, HighlightInfo } from '../types';
import { viewPresets as presetData } from '../data/organs';

// ============================================================
// 占位模型（无 GLB 或加载失败时显示）
// ============================================================
function PlaceholderModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.3;
  });
  return (
    <mesh ref={meshRef} castShadow>
      <torusKnotGeometry args={[1.2, 0.4, 128, 32]} />
      <meshStandardMaterial color="#3a6aff" metalness={0.3} roughness={0.5}
        emissive="#1a3a80" emissiveIntensity={0.2} />
    </mesh>
  );
}

// ============================================================
// 加载进度
// ============================================================
function Loader() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <Html center>
      <div style={{ color: '#7cb8ff', fontFamily: 'monospace', fontSize: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🧬</div>
        <div>加载中... {progress.toFixed(0)}%</div>
        <div style={{ width: 160, height: 3, background: 'rgba(100,160,255,0.1)', margin: '10px auto', borderRadius: 2 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #4af, #7cb8ff)', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
      </div>
    </Html>
  );
}

// ============================================================
// 模型组件 — 无 hooks 违规，useGLTF 在最外层调用
// ============================================================
function Model({
  path, wireframe, transparent, transparency, clippingEnabled,
  onHoverParts, onSelectPart,
}: {
  path: string;
  wireframe: boolean;
  transparent: boolean;
  transparency: number;
  clippingEnabled: boolean;
  onHoverParts: (info: HighlightInfo | null) => void;
  onSelectPart: (info: HighlightInfo | null) => void;
}) {
  const { scene } = useGLTF(path);
  const groupRef = useRef<THREE.Group>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const originalMaterials = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);

  // 居中模型
  useEffect(() => {
    if (!groupRef.current || !scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0.001 ? 3 / maxDim : 1;
    groupRef.current.position.set(-center.x * s, -center.y * s, -center.z * s);
    groupRef.current.scale.setScalar(s);
  }, [scene]);

  // 收集 mesh 信息
  useEffect(() => {
    if (!scene) return;
    meshMapRef.current.clear();
    originalMaterials.current.clear();
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        meshMapRef.current.set(m.uuid, m);
        const rm = m.material;
        originalMaterials.current.set(m.uuid, Array.isArray(rm) ? rm.map((x) => (x as THREE.Material).clone()) : (rm as THREE.Material).clone());
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }, [scene]);

  // 线框
  useEffect(() => {
    meshMapRef.current.forEach((m) => {
      const f = (mat: THREE.Material) => { mat.wireframe = wireframe; mat.needsUpdate = true; };
      if (Array.isArray(m.material)) m.material.forEach(f);
      else f(m.material);
    });
  }, [wireframe]);

  // 半透明
  useEffect(() => {
    meshMapRef.current.forEach((m) => {
      const f = (mat: THREE.Material) => {
        mat.transparent = transparent;
        mat.opacity = transparent ? transparency : 1;
        mat.depthWrite = !transparent || transparency > 0.7;
        mat.needsUpdate = true;
      };
      if (Array.isArray(m.material)) m.material.forEach(f);
      else f(m.material);
    });
  }, [transparent, transparency]);

  // 剖切
  useEffect(() => {
    meshMapRef.current.forEach((m) => {
      m.material.clippingPlanes = clippingEnabled ? [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)] : null;
      m.material.needsUpdate = true;
    });
  }, [clippingEnabled]);

  // 鼠标交互
  const emitHover = useCallback((mesh: THREE.Mesh, on: boolean) => {
    const f = (m: THREE.Material) => { m.emissive = on ? new THREE.Color('#3a6aff') : new THREE.Color('#000'); m.emissiveIntensity = on ? 0.3 : 0; m.needsUpdate = true; };
    if (Array.isArray(mesh.material)) mesh.material.forEach(f); else f(mesh.material);
  }, []);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const m = e.object as THREE.Mesh;
    emitHover(m, true);
    const wp = new THREE.Vector3(); m.getWorldPosition(wp);
    onHoverParts?.({ id: m.uuid, name: m.name || '结构', position: [wp.x, wp.y, wp.z] });
  }, [onHoverParts, emitHover]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    emitHover(e.object as THREE.Mesh, false);
    onHoverParts?.(null);
  }, [onHoverParts, emitHover]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const m = e.object as THREE.Mesh;
    meshMapRef.current.forEach((x) => { if (x !== m) emitHover(x, false); });
    const f = (mat: THREE.Material) => { mat.emissive = new THREE.Color('#4a9fff'); mat.emissiveIntensity = 0.5; mat.needsUpdate = true; };
    if (Array.isArray(m.material)) m.material.forEach(f); else f(m.material);
    setSelectedMesh(m.uuid);
    const wp = new THREE.Vector3(); m.getWorldPosition(wp);
    onSelectPart?.({ id: m.uuid, name: m.name || '结构', position: [wp.x, wp.y, wp.z] });
  }, [onSelectPart, emitHover]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onClick={handleClick} />
      {selectedMesh && meshMapRef.current.has(selectedMesh) && (
        <Edges visible scale={1} renderOrder={1000} color="#4a9fff" lineWidth={1.5} threshold={15}
          geometry={meshMapRef.current.get(selectedMesh)!.geometry} />
      )}
    </group>
  );
}

// ============================================================
// ErrorBoundary
// ============================================================
class ModelErrorBoundary extends Component<{ onError: () => void; children: React.ReactNode }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.hasError ? null : this.props.children; }
}

// ============================================================
// 灯光
// ============================================================
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.65} color="#d0e0ff" />
      <directionalLight position={[6, 10, 5]} intensity={1.3} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-far={50} shadow-camera-left={-10} shadow-camera-right={10}
        shadow-camera-top={10} shadow-camera-bottom={-10} />
      <directionalLight position={[-4, 3, -4]} intensity={0.4} color="#4a8fff" />
      <pointLight position={[3, -3, 4]} intensity={0.3} color="#ff6a8a" />
    </>
  );
}

// ============================================================
// 相机控制
// ============================================================
function CameraController({ viewPreset }: { viewPreset: string | null }) {
  const controlsRef = useRef<any>(null);
  useEffect(() => {
    if (viewPreset && controlsRef.current) {
      const preset = presetData.find((p) => p.name === viewPreset);
      if (preset) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.object.position.set(...preset.position);
        controlsRef.current.update();
      }
    }
  }, [viewPreset]);
  return <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.1}
    minDistance={1} maxDistance={15} maxPolarAngle={Math.PI * 0.85} />;
}

// ============================================================
// 无模型提示文字
// ============================================================
function NoModelHint() {
  return (
    <Html center style={{ pointerEvents: 'none' }}>
      <div style={{ textAlign: 'center', color: 'rgba(180,200,240,0.45)', fontFamily: 'monospace' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🧬</div>
        <div style={{ fontSize: 16 }}>暂无 3D 模型</div>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>将 GLB 放入 public/models/ 后推送即可</div>
      </div>
    </Html>
  );
}

// ============================================================
// 主场景
// ============================================================
interface Scene3DProps {
  modelPath: string;
  features: SceneFeatures;
  viewPreset: string | null;
  onViewApplied: () => void;
  onHoverParts: (info: HighlightInfo | null) => void;
  onSelectPart: (info: HighlightInfo | null) => void;
}

export const Scene3D: React.FC<Scene3DProps> = ({
  modelPath, features, viewPreset, onViewApplied,
  onHoverParts, onSelectPart,
}) => {
  const [loadError, setLoadError] = useState(false);
  const hasModel = !!modelPath;

  return (
    <Canvas
      camera={{ position: [3, 2, 6], fov: 48, near: 0.1, far: 100 }}
      shadows
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
        localClippingEnabled: features.clipping,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#080c14'));
      }}
    >
      <Lighting />

      <Suspense fallback={<Loader />}>
        {hasModel ? (
          <ModelErrorBoundary onError={() => setLoadError(true)}>
            <Model
              key={modelPath}
              path={modelPath}
              wireframe={features.wireframe}
              transparent={features.transparent}
              transparency={features.transparency}
              clippingEnabled={features.clipping}
              onHoverParts={onHoverParts}
              onSelectPart={onSelectPart}
            />
          </ModelErrorBoundary>
        ) : (
          <PlaceholderModel />
        )}
      </Suspense>

      {(!hasModel || loadError) && <NoModelHint />}

      {features.showGrid && (
        <Grid position={[0, -1.5, 0]} args={[24, 24]} cellSize={0.5} cellThickness={0.5}
          cellColor="#111a2e" sectionSize={2} sectionThickness={1} sectionColor="#1a2e4a"
          fadeDistance={40} infiniteGrid />
      )}

      <ContactShadows position={[0, -1.5, 0]} opacity={0.25} scale={10} blur={2.5} far={4} />
      <Environment preset="city" />
      <CameraController viewPreset={viewPreset} />
    </Canvas>
  );
};
