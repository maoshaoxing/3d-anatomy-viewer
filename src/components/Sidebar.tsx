import React, { useMemo } from 'react';
import { Menu, Switch, Slider, Button, Space, Divider, Typography } from 'antd';
import {
  HeartOutlined,
  EyeInvisibleOutlined,
  ScissorOutlined,
  EyeOutlined,
  ReloadOutlined,
  AimOutlined,
  SettingOutlined,
  AimOutlined as BulbIcon,
} from '@ant-design/icons';
import type { OrganCategory, OrganItem, SceneFeatures } from '../types';
import { viewPresets } from '../data/organs';

const { Text } = Typography;

interface SidebarProps {
  categories: OrganCategory[];
  activeOrganId: string | null;
  features: SceneFeatures;
  onSelectOrgan: (organ: OrganItem) => void;
  onFeatureChange: (key: keyof SceneFeatures, value: boolean | number) => void;
  onViewPreset: (presetName: string) => void;
  onResetView: () => void;
}

const sidebarStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: '#0d1117',
  borderRight: '1px solid rgba(100, 160, 255, 0.1)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '16px 16px 12px',
  borderBottom: '1px solid rgba(100, 160, 255, 0.08)',
};

const sectionStyle: React.CSSProperties = {
  padding: '8px 16px 4px',
  fontSize: 11,
  color: 'rgba(180, 200, 240, 0.45)',
  textTransform: 'uppercase' as const,
  letterSpacing: 1,
  fontWeight: 600,
};

const controlRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 16px',
  fontSize: 12,
  color: 'rgba(180, 200, 240, 0.75)',
};

const organItemStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px 8px 32px',
  cursor: 'pointer',
  fontSize: 12.5,
  color: active ? '#7cb8ff' : 'rgba(180, 200, 240, 0.7)',
  background: active ? 'rgba(100, 160, 255, 0.1)' : 'transparent',
  borderLeft: active ? '2px solid #4a8fff' : '2px solid transparent',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

const categoryHeaderStyle: React.CSSProperties = {
  padding: '10px 16px 8px',
  fontSize: 13,
  fontWeight: 600,
  color: 'rgba(200, 220, 255, 0.9)',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'default',
  userSelect: 'none' as const,
};

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  activeOrganId,
  features,
  onSelectOrgan,
  onFeatureChange,
  onViewPreset,
  onResetView,
}) => {
  return (
    <div style={sidebarStyle}>
      {/* 标题 */}
      <div style={headerStyle}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#c8d8ff', letterSpacing: 1, marginBottom: 2 }}>
          🧬 人体解剖
        </div>
        <div style={{ fontSize: 11, color: 'rgba(180, 200, 240, 0.4)', letterSpacing: 0.5 }}>
          3D Interactive Anatomy
        </div>
      </div>

      {/* 器官分类树 */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 8 }}>
        {categories.map((cat) => (
          <div key={cat.id}>
            <div style={categoryHeaderStyle}>
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </div>
            {cat.children.map((organ) => (
              <div
                key={organ.id}
                style={organItemStyle(activeOrganId === organ.id)}
                onClick={() => onSelectOrgan(organ)}
                title={organ.nameEn}
              >
                <span style={{ opacity: 0.5 }}>●</span>
                {organ.name}
                <span style={{ fontSize: 10, opacity: 0.4, marginLeft: 'auto' }}>
                  {organ.nameEn}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 分隔 */}
      <Divider style={{ margin: '4px 0', borderColor: 'rgba(100,160,255,0.08)' }} />

      {/* 功能开关 */}
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        <div style={sectionStyle}>显示控制</div>

        <div style={controlRowStyle}>
          <span><EyeInvisibleOutlined style={{ marginRight: 6 }} />线框模式</span>
          <Switch
            size="small"
            checked={features.wireframe}
            onChange={(v) => onFeatureChange('wireframe', v)}
          />
        </div>

        <div style={controlRowStyle}>
          <span><EyeOutlined style={{ marginRight: 6 }} />半透明</span>
          <Switch
            size="small"
            checked={features.transparent}
            onChange={(v) => onFeatureChange('transparent', v)}
          />
        </div>

        {features.transparent && (
          <div style={{ padding: '0 16px 8px' }}>
            <Slider
              min={0.05}
              max={1}
              step={0.05}
              value={features.transparency}
              onChange={(v) => onFeatureChange('transparency', v as number)}
              styles={{
                track: { background: '#4a8fff' },
                handle: { borderColor: '#4a8fff' },
                rail: { background: 'rgba(100,160,255,0.15)' },
              }}
              tooltip={{ formatter: (v) => `${Math.round((v || 0) * 100)}%` }}
            />
          </div>
        )}

        <div style={controlRowStyle}>
          <span><ScissorOutlined style={{ marginRight: 6 }} />剖切视图</span>
          <Switch
            size="small"
            checked={features.clipping}
            onChange={(v) => onFeatureChange('clipping', v)}
          />
        </div>

        <div style={controlRowStyle}>
          <span><ReloadOutlined style={{ marginRight: 6 }} />自动旋转</span>
          <Switch
            size="small"
            checked={features.autoRotate}
            onChange={(v) => onFeatureChange('autoRotate', v)}
          />
        </div>

        <div style={controlRowStyle}>
          <span>参考网格</span>
          <Switch
            size="small"
            checked={features.showGrid}
            onChange={(v) => onFeatureChange('showGrid', v)}
          />
        </div>

        <div style={controlRowStyle}>
          <span>解剖标注</span>
          <Switch
            size="small"
            checked={features.showLabels}
            onChange={(v) => onFeatureChange('showLabels', v)}
          />
        </div>
      </div>

      <Divider style={{ margin: '4px 0', borderColor: 'rgba(100,160,255,0.08)' }} />

      {/* 视角预设 */}
      <div style={{ paddingBottom: 8 }}>
        <div style={sectionStyle}>视角预设</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 12px' }}>
          {viewPresets.map((preset) => (
            <Button
              key={preset.name}
              size="small"
              type="text"
              onClick={() => onViewPreset(preset.name)}
              style={{
                color: 'rgba(180, 200, 240, 0.7)',
                fontSize: 11,
                padding: '2px 8px',
                height: 24,
                border: '1px solid rgba(100,160,255,0.12)',
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div style={{ padding: '8px 12px' }}>
          <Button
            block
            size="small"
            type="text"
            icon={<AimOutlined />}
            onClick={onResetView}
            style={{
              color: 'rgba(180, 200, 240, 0.7)',
              fontSize: 11,
              border: '1px solid rgba(100,160,255,0.12)',
            }}
          >
            重置视角
          </Button>
        </div>
      </div>

      {/* 底部信息 */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid rgba(100, 160, 255, 0.06)',
        fontSize: 10,
        color: 'rgba(180, 200, 240, 0.3)',
        textAlign: 'center' as const,
      }}>
        3D Anatomy Viewer v2.0
      </div>
    </div>
  );
};
