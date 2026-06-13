import React, { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
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
import type { ViewPreset } from '../types';

// ============================================================
// 默认占位模型（无 GLB 时显示）
// ============================================================
function PlaceholderModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });
  return (
    <mesh ref={meshRef} castShadow>
      <torusKnotGeometry args={[1.2, 0.4, 128, 32]} />
      <meshStandardMaterial
        color="#3a6aff"
        metalness={0.3}
        roughness={0.5}
        emissive="#1a3a80"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

// ============================================================
// 加载器
// ============================================================
function Loader() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <Html center>
      <div style={{ color: '#7cb8ff', fontFamily: 'monospace', fontSize: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🧬</div>
        <div>加载模型... {progress.toFixed(0)}%</div>
        <div style={{ width: 160, height: 3, background: 'rgba(100,160,255,0.1)', margin: '10px auto', borderRadius: 2 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #4af, #7cb8ff)', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
      </div>
    </Html>
  );
}

// ============================================================
// 模型组件
// ============================================================
function Model({
  path,
  wireframe,
  transparent,
  transparency,
  clippingEnabled,
  onHoverParts,
  onSelectPart,
  onLoadError,
}: {
  path: string;
  wireframe: boolean;
  transparent: boolean;
  transparency: number;
  clippingEnabled: boolean;
  onHoverParts: (info: HighlightInfo | null) => void;
  onSelectPart: (info: HighlightInfo | null) => void;
  onLoadError: () => void;
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  let scene: THREE.Group | null = null;

  try {
    const result = useGLTF(path);
    scene = result.scene;
  } catch {
    if (!loadFailed) {
      setLoadFailed(true);
      onLoadError();
    }
  }

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
    const s = maxDim > 0 ? 3 / maxDim : 1;
    groupRef.current.position.set(-center.x * s, -center.y * s, -center.z * s);
    groupRef.current.scale.setScalar(s);
  }, [scene]);

  // 收集 Mesh 并存储原始材质
  useEffect(() => {
    if (!scene) return;
    meshMapRef.current.clear();
    originalMaterials.current.clear();
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const id = mesh.uuid;
        meshMapRef.current.set(id, mesh);
        const mat = mesh.material;
        if (Array.isArray(mat)) {
          originalMaterials.current.set(id, mat.map((m) => m.clone()));
        } else {
          originalMaterials.current.set(id, mat.clone());
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);

  // 线框
  useEffect(() => {
    meshMapRef.current.forEach((mesh) => {
      const apply = (m: THREE.Material) => { m.wireframe = wireframe; m.needsUpdate = true; };
      if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
      else apply(mesh.material);
    });
  }, [wireframe]);

  // 半透明
  useEffect(() => {
    meshMapRef.current.forEach((mesh) => {
      const apply = (m: THREE.Material) => {
        m.transparent = transparent;
        m.opacity = transparent ? transparency : 1;
        m.depthWrite = !transparent || transparency > 0.7;
        m.needsUpdate = true;
      };
      if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
      else apply(mesh.material);
    });
  }, [transparent, transparency]);

  // 剖切
  useEffect(() => {
    meshMapRef.current.forEach((mesh) => {
      if (clippingEnabled) {
        mesh.material.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];
      } else {
        mesh.material.clippingPlanes = null;
      }
      mesh.material.needsUpdate = true;
    });
  }, [clippingEnabled]);

  // 鼠标事件
  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const apply = (m: THREE.Material) => { m.emissive = new THREE.Color('#3a6aff'); m.emissiveIntensity = 0.3; m.needsUpdate = true; };
    if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
    else apply(mesh.material);
    const wp = new THREE.Vector3(); mesh.getWorldPosition(wp);
    onHoverParts({ id: mesh.uuid, name: mesh.name || '结构', position: [wp.x, wp.y, wp.z] });
  }, [onHoverParts]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const apply = (m: THREE.Material) => { m.emissive = new THREE.Color('#000'); m.emissiveIntensity = 0; m.needsUpdate = true; };
    if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
    else apply(mesh.material);
    onHoverParts(null);
  }, [onHoverParts]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    meshMapRef.current.forEach((m) => {
      if (m !== mesh) {
        const apply = (mat: THREE.Material) => { mat.emissive = new THREE.Color('#000'); mat.emissiveIntensity = 0; mat.needsUpdate = true; };
        if (Array.isArray(m.material)) m.material.forEach(apply);
        else apply(m.material);
      }
    });
    const apply = (m: THREE.Material) => { m.emissive = new THREE.Color('#4a9fff'); m.emissiveIntensity = 0.5; m.needsUpdate = true; };
    if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
    else apply(mesh.material);
    setSelectedMesh(mesh.uuid);
    const wp = new THREE.Vector3(); mesh.getWorldPosition(wp);
    onSelectPart({ id: mesh.uuid, name: mesh.name || '结构', position: [wp.x, wp.y, wp.z] });
  }, [onSelectPart]);

  if (loadFailed || !scene) return null;

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
function CameraController({ viewPreset, onReady }: { viewPreset: string | null; onReady?: () => void }) {
  const controlsRef = useRef<any>(null);
  useEffect(() => {
    if (viewPreset && controlsRef.current) {
      const preset = presetData.find((p) => p.name === viewPreset);
      if (preset) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.object.position.set(...preset.position);
        controlsRef.current.update();
        onReady?.();
      }
    }
  }, [viewPreset]);
  return <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.1}
    minDistance={1} maxDistance={15} maxPolarAngle={Math.PI * 0.85} />;
}

// ============================================================
// 无模型提示
// ============================================================
function NoModelHint() {
  return (
    <Html center style={{ pointerEvents: 'none' }}>
      <div style={{ textAlign: 'center', color: 'rgba(180,200,240,0.5)', fontFamily: 'monospace' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🧬</div>
        <div style={{ fontSize: 16, marginBottom: 4 }}>暂无 3D 模型</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>将 GLB 文件放入 public/models/ 后刷新</div>
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
  modelPath,
  features,
  viewPreset,
  onViewApplied,
  onHoverParts,
  onSelectPart,
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
      }}
      style={{ background: '#080c14' }}
    >
      <Lighting />

      <Suspense fallback={<Loader />}>
        {hasModel ? (
          <Model
            key={modelPath}
            path={modelPath}
            wireframe={features.wireframe}
            transparent={features.transparent}
            transparency={features.transparency}
            clippingEnabled={features.clipping}
            onHoverParts={onHoverParts}
            onSelectPart={onSelectPart}
            onLoadError={() => setLoadError(true)}
          />
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
      <CameraController viewPreset={viewPreset} onReady={onViewApplied} />
    </Canvas>
  );
};
