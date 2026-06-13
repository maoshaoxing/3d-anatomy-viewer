# MeshLab 模型优化参数文档

## 环境要求

| 项目 | 版本 |
|------|------|
| MeshLab | 2022.02 或更高 |
| meshlabserver | 随 MeshLab 安装，需加入 PATH |

## 优化流程（4步）

### 1. 减面 — Quadric Edge Collapse Decimation

| 参数 | 值 | 说明 |
|------|-----|------|
| `TargetFaceNum` | 20000 | 目标面数。器官类 2-5 万，细胞类 5 千-1 万 |
| `TargetPerc` | 0 | 按面数模式（设为非 0 则按比例） |
| `QualityThr` | true | 启用质量阈值，防止关键区域过度减面 |
| `QualityThrValue` | 0.3 | 质量阈值（越低越激进） |
| `PreserveBoundary` | true | 保护边界边不塌陷 |
| `OptimalPlacement` | true | 最优顶点位置计算 |
| `PreserveNormal` | true | 保持法线方向 |

### 2. 修复破面

按顺序执行：
- **Merge Close Vertices** (阈值 0.0001m)：合并重合顶点
- **Remove Isolated Pieces**：删除游离碎片
- **Remove Duplicate Faces / Vertices**：删除重复面/点
- **Remove Zero Area Faces**：删除零面积退化面
- **Remove Unreferenced Vertices**：清理孤立顶点
- **Close Holes** (MaxHoleSize=30)：修补小孔洞
- **Recompute Normals**：重算法线

### 3. 重置坐标

- **Move to Center of bbox**：XYZ 三轴居中
- **Translate to Origin (Y=min)**：模型底部对齐 Y=0 平面

### 4. 统一单位

- **Freeze Transform**：冻结变换矩阵，重置为单位矩阵
- 单位继承自 Blender 导出时的米制校准

## 调用方式

### 命令行批量处理
```bash
# 单个文件
meshlabserver -i raw_model/heart.glb -o optimized_model/heart.glb -s scripts/optimize_model.mlx

# 批量（推荐使用封装好的 .bat 脚本）
scripts\run_meshlab_optimize.bat
```

## 自检清单

- [ ] 面数在目标范围内（约 2 万面）
- [ ] 无渲染破洞（MeshLab 中 F2 切换线框检查）
- [ ] 模型居中，底部在地平面上
- [ ] 法线方向一致（无黑面闪烁）
- [ ] 文件大小合理（Draco 压缩后器官类约 1-5 MB）

## 调参建议

| 场景 | 调整参数 |
|------|---------|
| 减面后模型变形严重 | 降低 TargetFaceNum，提高 QualityThrValue 到 0.5 |
| 文件太大 | 降低 TargetFaceNum 到 10000 |
| 仍有破面 | 增大 Close Holes 的 MaxHoleSize |
| 模型跑偏 | 检查 Blender 导出时是否 apply 了变换 |
