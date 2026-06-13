import React, { Suspense, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import {
  OrbitControls,
  useGLTF,
  Environment,
  ContactShadows,
  Grid,
  Html,
  useProgress,
  Bounds,
  Edges,
  Select,
} from '@react-three/drei';
import * as THREE from 'three';
import type { SceneFeatures, ViewPreset, HighlightInfo } from '../types';

// ============================================================
// 加载器
// ============================================================
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ color: '#7cb8ff', fontFamily: 'monospace', fontSize: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🧬</div>
        <div>加载模型... {progress.toFixed(0)}%</div>
        <div style={{
          width: 160, height: 3, background: 'rgba(100,160,255,0.1)',
          margin: '10px auto', borderRadius: 2,
        }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'linear-gradient(90deg, #4af, #7cb8ff)',
            borderRadius: 2, transition: 'width 0.3s',
          }} />
        </div>
      </div>
    </Html>
  );
}

// ============================================================
// 模型组件 — 支持高亮选中、线框、半透明、剖切
// ============================================================
function Model({
  path,
  wireframe,
  transparent,
  transparency,
  clippingEnabled,
  onHoverParts,
  onSelectPart,
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
  const [hoveredMesh, setHoveredMesh] = useState<string | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);

  // 居中模型
  useEffect(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 3 / maxDim;
    groupRef.current.position.set(-center.x * s, -center.y * s, -center.z * s);
    groupRef.current.scale.setScalar(s);
  }, [scene]);

  // 收集所有 Mesh 并存储原始材质
  useEffect(() => {
    meshMapRef.current.clear();
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const id = mesh.uuid;
        meshMapRef.current.set(id, mesh);
        if (!originalMaterials.current.has(id)) {
          const mat = mesh.material;
          if (Array.isArray(mat)) {
            originalMaterials.current.set(id, [...mat]);
          } else {
            originalMaterials.current.set(id, mat);
          }
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);

  // 线框模式
  useEffect(() => {
    meshMapRef.current.forEach((mesh, id) => {
      if (wireframe) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => { m.wireframe = true; });
        } else {
          mesh.material.wireframe = true;
        }
      } else {
        const orig = originalMaterials.current.get(id);
        if (orig) {
          if (Array.isArray(orig)) {
            mesh.material = orig.map((m) => {
              const cloned = (m as THREE.Material).clone();
              cloned.wireframe = false;
              return cloned;
            });
          } else {
            mesh.material = (orig as THREE.Material).clone();
            (mesh.material as THREE.Material).wireframe = false;
          }
        }
      }
    });
  }, [wireframe]);

  // 半透明模式
  useEffect(() => {
    meshMapRef.current.forEach((mesh) => {
      const applyOpacity = (mat: THREE.Material) => {
        if (transparent) {
          mat.transparent = true;
          mat.opacity = transparency;
          mat.depthWrite = transparency > 0.7;
          mat.needsUpdate = true;
        } else {
          mat.transparent = false;
          mat.opacity = 1;
          mat.depthWrite = true;
          mat.needsUpdate = true;
        }
      };

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(applyOpacity);
      } else {
        applyOpacity(mesh.material);
      }
    });
  }, [transparent, transparency]);

  // 剖切 — 使用 clippingPlanes
  useEffect(() => {
    meshMapRef.current.forEach((mesh) => {
      if (clippingEnabled) {
        mesh.material.clipShadows = true;
        mesh.material.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];
        mesh.material.clipIntersection = false;
        mesh.material.needsUpdate = true;
      } else {
        mesh.material.clippingPlanes = null;
        mesh.material.needsUpdate = true;
      }
    });
  }, [clippingEnabled]);

  // 鼠标悬浮事件
  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    setHoveredMesh(mesh.uuid);
    // 高亮发光
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => {
        m.emissive = new THREE.Color('#3a6aff');
        m.emissiveIntensity = 0.3;
        m.needsUpdate = true;
      });
    } else {
      mesh.material.emissive = new THREE.Color('#3a6aff');
      mesh.material.emissiveIntensity = 0.3;
      mesh.material.needsUpdate = true;
    }
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    onHoverParts({ id: mesh.uuid, name: mesh.name || '未命名', position: [worldPos.x, worldPos.y, worldPos.z] });
  }, [onHoverParts]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    setHoveredMesh(null);
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => {
        m.emissive = new THREE.Color('#000000');
        m.emissiveIntensity = 0;
        m.needsUpdate = true;
      });
    } else {
      mesh.material.emissive = new THREE.Color('#000000');
      mesh.material.emissiveIntensity = 0;
      mesh.material.needsUpdate = true;
    }
    onHoverParts(null);
  }, [onHoverParts]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    // 重置上一个选中
    meshMapRef.current.forEach((m) => {
      if (m !== mesh) {
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => {
            mat.emissive = new THREE.Color('#000000');
            mat.emissiveIntensity = 0;
            mat.needsUpdate = true;
          });
        } else {
          m.material.emissive = new THREE.Color('#000000');
          m.material.emissiveIntensity = 0;
          m.material.needsUpdate = true;
        }
      }
    });
    // 高亮选中
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => {
        m.emissive = new THREE.Color('#4a9fff');
        m.emissiveIntensity = 0.5;
        m.needsUpdate = true;
      });
    } else {
      mesh.material.emissive = new THREE.Color('#4a9fff');
      mesh.material.emissiveIntensity = 0.5;
      mesh.material.needsUpdate = true;
    }
    setSelectedMesh(mesh.uuid);
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    onSelectPart({ id: mesh.uuid, name: mesh.name || '未命名', position: [worldPos.x, worldPos.y, worldPos.z] });
  }, [onSelectPart]);

  // 自转
  useFrame((_, delta) => {
    if (groupRef.current) {
      // 不在此处旋转，交给 OrbitControls 的 autoRotate
    }
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
      {/* 选中模型边框 */}
      {selectedMesh && meshMapRef.current.has(selectedMesh) && (
        <Edges
          visible
          scale={1}
          renderOrder={1000}
          color="#4a9fff"
          lineWidth={1.5}
          threshold={15}
          geometry={meshMapRef.current.get(selectedMesh)!.geometry}
          position={groupRef.current?.position}
        />
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
        shadow-camera-far={50} shadow-camera-left={-10}
        shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10}
      />
      <directionalLight position={[-4, 3, -4]} intensity={0.4} color="#4a8fff" />
      <pointLight position={[3, -3, 4]} intensity={0.3} color="#ff6a8a" />
      <pointLight position={[-4, -1, -3]} intensity={0.25} color="#4a8fff" />
    </>
  );
}

// ============================================================
// 视角控制相机
// ============================================================
function CameraController({ viewPreset, onReady }: {
  viewPreset: string | null;
  onReady?: () => void;
}) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (viewPreset && controlsRef.current) {
      const { viewPresets } = require('../data/organs');
      const preset = viewPresets.find((p: ViewPreset) => p.name === viewPreset);
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
// 主场景组件
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
      }}
      style={{ background: '#080c14' }}
    >
      <Lighting />

      <Suspense fallback={<Loader />}>
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
      </Suspense>

      {features.showGrid && (
        <Grid position={[0, -1.5, 0]} args={[24, 24]} cellSize={0.5} cellThickness={0.5}
          cellColor="#111a2e" sectionSize={2} sectionThickness={1} sectionColor="#1a2e4a"
          fadeDistance={40} infiniteGrid />
      )}

      <ContactShadows position={[0, -1.5, 0]} opacity={0.25} scale={10} blur={2.5} far={4} />
      <Environment preset="city" />

      <CameraController
        viewPreset={viewPreset}
        onReady={onViewApplied}
      />

      {/* 剖切平面可视化指示 */}
      {features.clipping && (
        <Html position={[0, 0.01, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            width: 200, textAlign: 'center', color: 'rgba(255,100,100,0.6)',
            fontSize: 11, fontFamily: 'monospace', transform: 'translate(-50%, -100%)',
          }}>
            ┄ 剖切平面 (Y=0) ┄
          </div>
        </Html>
      )}
    </Canvas>
  );
};
