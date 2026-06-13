import React from 'react';
import { Descriptions, Tag, Empty, Typography, Divider } from 'antd';
import type { OrganItem } from '../types';

const { Text, Title } = Typography;

interface InfoPanelProps {
  organ: OrganItem | null;
}

const panelStyle: React.CSSProperties = {
  height: '100%',
  background: '#0d1117',
  borderLeft: '1px solid rgba(100, 160, 255, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '20px 20px 16px',
  borderBottom: '1px solid rgba(100, 160, 255, 0.08)',
};

const bodyStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 16,
};

const paramRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  marginBottom: 6,
  background: 'rgba(100, 160, 255, 0.04)',
  borderRadius: 6,
  border: '1px solid rgba(100, 160, 255, 0.06)',
};

const tagStyle: React.CSSProperties = {
  background: 'rgba(100, 160, 255, 0.1)',
  border: '1px solid rgba(100, 160, 255, 0.2)',
  color: '#7cb8ff',
  fontSize: 11,
};

export const InfoPanel: React.FC<InfoPanelProps> = ({ organ }) => {
  if (!organ) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <Text style={{ color: '#c8d8ff', fontSize: 16, fontWeight: 600 }}>详细信息</Text>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: 'rgba(180,200,240,0.4)', fontSize: 12 }}>点击左侧器官查看详情</span>}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      {/* 标题 */}
      <div style={headerStyle}>
        <Title level={4} style={{ color: '#c8d8ff', margin: 0, fontSize: 18, fontWeight: 700 }}>
          {organ.name}
        </Title>
        <Text style={{ color: 'rgba(180,200,240,0.5)', fontSize: 12, fontFamily: 'monospace' }}>
          {organ.nameEn} · {organ.modelFile}
        </Text>
      </div>

      {/* 内容 */}
      <div style={bodyStyle}>
        {/* 简介 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(180, 200, 240, 0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            解剖简介
          </div>
          <Text style={{ color: 'rgba(200, 220, 255, 0.75)', fontSize: 13, lineHeight: 1.8 }}>
            {organ.description}
          </Text>
        </div>

        <Divider style={{ borderColor: 'rgba(100,160,255,0.08)', margin: '16px 0' }} />

        {/* 参数 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(180, 200, 240, 0.45)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            关键参数
          </div>
          {organ.params.map((param, idx) => (
            <div key={idx} style={paramRowStyle}>
              <Text style={{ color: 'rgba(180, 200, 240, 0.6)', fontSize: 12 }}>
                {param.label}
              </Text>
              <Tag style={tagStyle}>{param.value}</Tag>
            </div>
          ))}
        </div>

        <Divider style={{ borderColor: 'rgba(100,160,255,0.08)', margin: '16px 0' }} />

        {/* 交互提示 */}
        <div style={{ fontSize: 10, color: 'rgba(180, 200, 240, 0.3)', lineHeight: 1.8 }}>
          <div>🖱 左键拖拽 — 旋转视角</div>
          <div>🔍 滚轮 — 缩放</div>
          <div>📍 右键拖拽 — 平移</div>
          <div>👆 单击模型 — 查看标注</div>
          <div>🔄 侧边栏 — 切换器官 / 调整显示</div>
        </div>
      </div>
    </div>
  );
};
