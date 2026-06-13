# 3D 人体器官细胞漫游项目

基于 Three.js + React + Remotion 的 3D 器官/细胞交互漫游与视频渲染系统。

## 目录结构

```
├── raw_model/              # Blender 原始模型 & 导出 GLB
├── optimized_model/        # MeshLab 优化后 GLB
├── models/                 # 项目使用的 GLB 模型
├── public/models/          # Vite 静态服务 → 供 Web 预览
├── src/                    # 源代码
│   ├── App.tsx             # 3D 交互漫游页面（React + Three.js）
│   ├── RemotionScene.tsx   # Remotion 视频渲染场景
│   ├── Root.tsx            # Remotion Composition 注册
│   ├── index.ts            # Remotion 入口
│   └── main.tsx            # Vite 入口
├── remotion_video/         # 渲染视频输出
├── scripts/                # 自动化脚本
│   ├── pipeline.bat        # 全流程一键自动化
│   ├── blender_export_glb.py     # Blender GLB 批量导出
│   ├── optimize_model.mlx        # MeshLab 优化滤镜
│   ├── run_meshlab_optimize.bat  # MeshLab 批量调用
│   ├── apply_textures.py         # 纹理自动赋值
│   ├── sd_texture_prompts.md     # SD 纹理提示词模板
│   └── sync_models.bat           # 模型同步
└── logs/                   # 运行日志
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 准备模型

将优化后的 GLB 放入 `models/`，运行同步：

```bash
scripts\sync_models.bat
```

### 3. 启动 3D 预览

```bash
npm run dev
```

浏览器打开 http://localhost:3000，鼠标拖拽旋转、滚轮缩放。

### 4. 渲染视频

```bash
# Remotion Studio（实时预览调参）
npm run remotion:studio

# 渲染单个器官视频
npx remotion render heart-roam remotion_video/heart.mp4

# 或修改 package.json 中的 remotion:render 命令
npm run remotion:render
```

### 5. 全流程一键运行

```bash
scripts\pipeline.bat
```

选项：
- `--skip-blender`   跳过 Blender 导出
- `--skip-meshlab`   跳过 MeshLab 优化
- `--skip-check`     跳过场景自检
- `--skip-video`     跳过视频渲染
- `--model <name>`   指定模型（默认 heart）

## 迁移到 D 盘

将整个项目复制到 `D:\3D人体器官细胞漫游项目\`，脚本会自动适配路径。

## 技术栈

| 组件 | 技术 |
|------|------|
| 3D 渲染 | Three.js + @react-three/fiber + drei |
| 构建工具 | Vite 6 + React 18 + TypeScript |
| 视频渲染 | Remotion 4 |
| 模型处理 | Blender 3.6+ + MeshLab 2022.02+ |
| 纹理生成 | Stable Diffusion (SDXL) |
