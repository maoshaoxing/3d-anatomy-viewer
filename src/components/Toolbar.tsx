import React, { useCallback, useState } from 'react';
import { Button, Space, Tooltip, message, Modal } from 'antd';
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  CameraOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

interface ToolbarProps {
  onScreenshot: () => string | null;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
}

const toolbarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 16,
  zIndex: 100,
  display: 'flex',
  gap: 6,
  pointerEvents: 'auto',
};

const btnStyle: React.CSSProperties = {
  color: 'rgba(200, 220, 255, 0.75)',
  background: 'rgba(10, 20, 40, 0.75)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(100, 160, 255, 0.2)',
  fontSize: 14,
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const Toolbar: React.FC<ToolbarProps> = ({ onScreenshot, onFullscreenToggle, isFullscreen }) => {
  const handleScreenshot = useCallback(() => {
    const dataUrl = onScreenshot();
    if (dataUrl) {
      // 下载截图
      const link = document.createElement('a');
      link.download = `anatomy-screenshot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      message.success('截图已保存');
    } else {
      message.error('截图失败，请重试');
    }
  }, [onScreenshot]);

  return (
    <div style={toolbarStyle}>
      <Tooltip title="截图保存">
        <Button
          type="text"
          icon={<CameraOutlined />}
          onClick={handleScreenshot}
          style={btnStyle}
        />
      </Tooltip>

      <Tooltip title={isFullscreen ? '退出全屏' : '全屏模式'}>
        <Button
          type="text"
          icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          onClick={onFullscreenToggle}
          style={btnStyle}
        />
      </Tooltip>
    </div>
  );
};
