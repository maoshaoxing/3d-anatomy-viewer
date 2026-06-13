import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Ant Design 样式（暗色主题）
// 注意：antd v5 使用 CSS-in-JS，无需单独引入 CSS 文件
// 如果需要重置样式，取消下面这行注释：
// import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
