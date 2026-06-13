import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import { Sidebar } from './components/Sidebar';
import { InfoPanel } from './components/InfoPanel';
import { Scene3D } from './components/Scene3D';
import { Toolbar } from './components/Toolbar';
import { organCategories, allOrgans, findOrgan, defaultSceneFeatures, viewPresets } from './data/organs';
import type { OrganItem, SceneFeatures, HighlightInfo, ViewPreset } from './types';

// ============================================================
// 样式常量
// ============================================================
const SIDEBAR_WIDTH = 240;
const PANEL_WIDTH = 300;

const STYLES = {
  app: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    overflow: 'hidden',
    background: '#080c14',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,

  sidebar: {
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
    height: '100%',
    flexShrink: 0,
  } as React.CSSProperties,

  main: {
    flex: 1,
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    minWidth: 0,
  } as React.CSSProperties,

  panel: {
    width: PANEL_WIDTH,
    minWidth: PANEL_WIDTH,
    height: '100%',
    flexShrink: 0,
  } as React.CSSProperties,

  labelOverlay: {
    position: 'absolute' as const,
    padding: '4px 10px',
    background: 'rgba(10, 20, 40, 0.9)',
    border: '1px solid rgba(100, 160, 255, 0.4)',
    borderRadius: 4,
    color: '#c8d8ff',
    fontSize: 12,
    fontFamily: 'monospace',
    pointerEvents: 'none' as const,
    whiteSpace: 'nowrap' as const,
    transform: 'translate(-50%, -150%)',
    zIndex: 50,
  },

  topBar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    zIndex: 20,
    pointerEvents: 'none' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  titleTop: {
    color: 'rgba(180, 200, 240, 0.3)',
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 2,
    pointerEvents: 'none' as const,
  },
};

// ============================================================
// Antd 暗色主题
// ============================================================
const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#4a8fff',
    colorBgContainer: '#0d1117',
    colorBgElevated: '#0d1117',
    colorBorder: 'rgba(100, 160, 255, 0.12)',
    colorText: 'rgba(200, 220, 255, 0.85)',
    colorTextSecondary: 'rgba(180, 200, 240, 0.55)',
    borderRadius: 6,
    fontSize: 12,
    controlHeight: 28,
  } as any,
};

// ============================================================
// App 主组件
// ============================================================
export default function App() {
  const [activeOrgan, setActiveOrgan] = useState<OrganItem | null>(null);
  const [features, setFeatures] = useState<SceneFeatures>({ ...defaultSceneFeatures });
  const [viewPreset, setViewPreset] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HighlightInfo | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<HighlightInfo | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [labelPos, setLabelPos] = useState<{ x: number; y: number } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 获取 Canvas 引用
  useEffect(() => {
    const timer = setInterval(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvasRef.current = canvas;
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // 默认选中第一个器官
  useEffect(() => {
    if (!activeOrgan && allOrgans.length > 0) {
      setActiveOrgan(allOrgans[0]);
    }
  }, []);

  // 切换器官
  const handleSelectOrgan = useCallback((organ: OrganItem) => {
    setActiveOrgan(organ);
    setSelectedInfo(null);
    setHoverInfo(null);
  }, []);

  // 功能开关
  const handleFeatureChange = useCallback((key: keyof SceneFeatures, value: boolean | number) => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 视角预设
  const handleViewPreset = useCallback((name: string) => {
    setViewPreset(name);
    setTimeout(() => setViewPreset(null), 100);
  }, []);

  // 重置视角
  const handleResetView = useCallback(() => {
    setViewPreset('front');
    setTimeout(() => setViewPreset(null), 100);
  }, []);

  // 悬浮标注位置
  const handleHoverParts = useCallback((info: HighlightInfo | null) => {
    setHoverInfo(info);
    if (info && viewportRef.current) {
      // 粗略映射到屏幕坐标（简化处理）
      const [wx, wy] = info.position;
      const rect = viewportRef.current.getBoundingClientRect();
      setLabelPos({
        x: rect.width / 2 + wx * 40,
        y: rect.height / 2 - wy * 40,
      });
    } else {
      setLabelPos(null);
    }
  }, []);

  // 截图
  const handleScreenshot = useCallback((): string | null => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }, []);

  // 全屏
  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  const modelPath = activeOrgan ? `/models/${activeOrgan.modelFile}` : '';

  return (
    <ConfigProvider theme={darkTheme}>
      <div style={STYLES.app}>
        {/* 左侧边栏 */}
        <div style={STYLES.sidebar}>
          <Sidebar
            categories={organCategories}
            activeOrganId={activeOrgan?.id ?? null}
            features={features}
            onSelectOrgan={handleSelectOrgan}
            onFeatureChange={handleFeatureChange}
            onViewPreset={handleViewPreset}
            onResetView={handleResetView}
          />
        </div>

        {/* 中间 3D 视口 */}
        <div style={STYLES.main} ref={viewportRef}>
          {modelPath && (
            <Scene3D
              modelPath={modelPath}
              features={features}
              viewPreset={viewPreset}
              onViewApplied={() => {}}
              onHoverParts={handleHoverParts}
              onSelectPart={setSelectedInfo}
            />
          )}

          {/* 顶栏 */}
          <div style={STYLES.topBar}>
            <span style={STYLES.titleTop}>
              {activeOrgan ? `${activeOrgan.name} · ${activeOrgan.nameEn}` : '选择一个器官开始探索'}
            </span>
          </div>

          {/* 工具栏（全屏、截图） */}
          <Toolbar
            onScreenshot={handleScreenshot}
            onFullscreenToggle={handleFullscreenToggle}
            isFullscreen={isFullscreen}
          />

          {/* 悬浮标注 */}
          {features.showLabels && hoverInfo && labelPos && (
            <div style={{ ...STYLES.labelOverlay, left: labelPos.x, top: labelPos.y }}>
              {hoverInfo.name || '结构'}
            </div>
          )}
        </div>

        {/* 右侧信息面板 */}
        <div style={STYLES.panel}>
          <InfoPanel organ={activeOrgan} />
        </div>
      </div>
    </ConfigProvider>
  );
}
