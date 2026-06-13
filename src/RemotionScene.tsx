import React, { Suspense, useRef, useEffect, useState } from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useGLTF,
  Environment,
  ContactShadows,
  Grid,
  Html,
  useProgress,
  OrbitControls,
} from '@react-three/drei';
import * as THREE from 'three';

// ============================================================
// 类型定义
// ============================================================
interface RemotionSceneProps {
  modelPath: string;
  modelName: string;
  durationInSeconds: number;
}

// ============================================================
// Remotion 受控的相机运镜
// ============================================================
function AnimatedCamera({ frame, fps, durationInFrames }: {
  frame: number;
  fps: number;
  durationInFrames: number;
}) {
  const { camera } = useThree();
  const totalTime = durationInFrames / fps;

  useFrame(() => {
    // 相机围绕模型旋转
    const progress = frame / durationInFrames; // 0 → 1
    const angle = progress * Math.PI * 2;       // 完整一圈

    // 相机轨道：初始从左前上方开始，缓慢旋转
    const radius = 5 + Math.sin(progress * Math.PI) * 1.5; // 5-6.5 米
    const height = 2 + Math.cos(progress * Math.PI * 2) * 1.5;

    camera.position.x = Math.cos(angle) * radius;
    camera.position.z = Math.sin(angle) * radius;
    camera.position.y = height;

    // 始终看向原点
    camera.lookAt(0, 0, 0);

    // 缓慢改变 FOV
    camera.zoom = 1 + Math.sin(progress * Math.PI * 2) * 0.3;
    camera.updateProjectionMatrix();
  });

  return null;
}

// ============================================================
// 模型组件（支持 Remotion 帧驱动）
// ============================================================
function Model({ path, frame, durationInFrames }: {
  path: string;
  frame: number;
  durationInFrames: number;
}) {
  const { scene } = useGLTF(path);
  const groupRef = useRef<THREE.Group>(null);

  // 入场弹簧动画
  const entryScale = spring({
    frame,
    fps: 30,
    config: { damping: 12, mass: 0.8 },
  });

  // 居中模型
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 3 / maxDim;
    if (groupRef.current) {
      groupRef.current.position.set(-center.x, -center.y, -center.z);
      groupRef.current.scale.setScalar(s);
    }
  }, [scene]);

  // 启用阴影
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);

  // 模型自转（缓慢）
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef} scale={[entryScale * 0.01, entryScale * 0.01, entryScale * 0.01]}>
      <primitive object={scene} />
    </group>
  );
}

// ============================================================
// 进度条加载
// ============================================================
function SceneLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ color: '#8af', fontFamily: 'monospace', fontSize: 24, textAlign: 'center' }}>
        <div>加载 3D 模型...</div>
        <div style={{
          width: 300, height: 6, background: '#1a1a3a',
          margin: '16px auto', borderRadius: 3,
        }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'linear-gradient(90deg, #4af, #8af)',
            borderRadius: 3, transition: 'width 0.3s',
          }} />
        </div>
      </div>
    </Html>
  );
}

// ============================================================
// 3D 场景（内嵌在 Remotion Canvas 中）
// ============================================================
function ThreeScene({ modelPath, frame, fps, durationInFrames }: {
  modelPath: string;
  frame: number;
  fps: number;
  durationInFrames: number;
}) {
  return (
    <>
      {/* 灯光 */}
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#4a8fff" />
      <pointLight position={[5, -2, 5]} intensity={0.4} color="#ff6a8a" />

      {/* 模型 */}
      <Suspense fallback={<SceneLoader />}>
        <Model path={modelPath} frame={frame} durationInFrames={durationInFrames} />
      </Suspense>

      {/* 地面 */}
      <ContactShadows position={[0, -1.5, 0]} opacity={0.3} scale={10} blur={2} far={4} />
      <Grid
        position={[0, -1.5, 0]}
        args={[30, 30]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1a2a4a"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#2a4a8a"
        fadeDistance={50}
        infiniteGrid
      />

      {/* 环境光 */}
      <Environment preset="city" />

      {/* 动画相机 */}
      <AnimatedCamera frame={frame} fps={fps} durationInFrames={durationInFrames} />
    </>
  );
}

// ============================================================
// 文字标注叠加层
// ============================================================
function Overlay({ modelName, frame, durationInFrames }: {
  modelName: string;
  frame: number;
  durationInFrames: number;
}) {
  // 标题淡入
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  // 标题上移
  const titleY = interpolate(frame, [0, 45], [40, 0], { extrapolateRight: 'clamp' });

  // 底部信息淡入
  const infoOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' });

  // 进度条
  const progress = frame / durationInFrames;

  // 模型名称映射
  const nameMap: Record<string, string> = {
    heart: '心脏 Heart',
    brain: '大脑 Brain',
    lung: '肺 Lung',
    liver: '肝脏 Liver',
    kidney: '肾脏 Kidney',
    cell: '人体细胞 Human Cell',
    neuron: '神经元 Neuron',
    blood_vessel: '血管 Blood Vessel',
    'all-organs': '人体器官细胞漫游',
  };

  const displayName = nameMap[modelName] || modelName;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* 顶部标题 */}
      <div style={{
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        textAlign: 'center',
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
      }}>
        <h1 style={{
          color: '#c8d8ff',
          fontSize: 56,
          fontWeight: 700,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: 6,
          margin: 0,
          textShadow: '0 0 40px rgba(100,160,255,0.4), 04px 8px rgba(0,0,0,0.5)',
        }}>
          {displayName}
        </h1>
        <p style={{
          color: 'rgba(180,200,240,0.6)',
          fontSize: 22,
          marginTop: 8,
          fontFamily: 'monospace',
          letterSpacing: 4,
        }}>
          3D 交互式漫游
        </p>
      </div>

      {/* 底部进度条 */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 60,
        right: 60,
        opacity: infoOpacity,
      }}>
        <div style={{
          height: 2,
          background: 'rgba(100,160,255,0.15)',
          borderRadius: 1,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4af, #8af)',
            borderRadius: 1,
            transition: 'width 0.1s linear',
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          color: 'rgba(180,200,240,0.4)',
          fontSize: 13,
          fontFamily: 'monospace',
        }}>
          <span>{formatTime(frame / 30)}</span>
          <span>{formatTime(durationInFrames / 30)}</span>
        </div>
      </div>

      {/* 四角装饰 */}
      <CornerDecorations />
    </AbsoluteFill>
  );
}

function CornerDecorations() {
  const cornerStyle = (top: boolean, left: boolean): React.CSSProperties => ({
    position: 'absolute',
    [top ? 'top' : 'bottom']: 30,
    [left ? 'left' : 'right']: 30,
    width: 40,
    height: 40,
    borderColor: 'rgba(100,160,255,0.15)',
    borderStyle: 'solid',
    borderWidth: 2,
    borderBottom: top ? undefined : 'none',
    borderRight: left ? undefined : 'none',
    borderTop: top ? 'none' : undefined,
    borderLeft: left ? 'none' : undefined,
  });

  return (
    <>
      <div style={cornerStyle(true, true)} />
      <div style={cornerStyle(true, false)} />
      <div style={cornerStyle(false, true)} />
      <div style={cornerStyle(false, false)} />
    </>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ============================================================
// Remotion 场景主组件
// ============================================================
export const RemotionScene: React.FC<RemotionSceneProps> = ({
  modelPath,
  modelName,
  durationInSeconds,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durationInFrames = fps * durationInSeconds;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      {/* 3D Canvas */}
      <AbsoluteFill>
        <Canvas
          camera={{ position: [5, 2, 6], fov: 50 }}
          shadows
          gl={{
            antialias: true,
            preserveDrawingBuffer: true, // Remotion 渲染需要
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <ThreeScene
            modelPath={modelPath}
            frame={frame}
            fps={fps}
            durationInFrames={durationInFrames}
          />
        </Canvas>
      </AbsoluteFill>

      {/* 文字标注叠加 */}
      <Overlay modelName={modelName} frame={frame} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
