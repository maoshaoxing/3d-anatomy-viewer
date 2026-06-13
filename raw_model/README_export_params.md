# Blender → GLB 导出参数文档

## 环境要求

| 项目 | 版本 |
|------|------|
| Blender | 3.6 LTS 或更高 |
| Python | Blender 内置 Python (≥3.10) |

## 调用方式

```bash
# Windows
blender --background --python "D:\3D人体器官细胞漫游项目\scripts\blender_export_glb.py"

# 或指定 Blend 文件逐个处理
blender --background "模型.blend" --python "D:\3D人体器官细胞漫游项目\scripts\blender_export_glb.py"
```

## 导出参数详表

| 参数 | 值 | 说明 |
|------|-----|------|
| `export_format` | `'GLB'` | 二进制 GLTF 容器，单文件便于分发 |
| `export_apply` | `True` | 导出前应用所有修改器（镜像、细分曲面等） |
| `export_image_format` | `'AUTO'` | 根据原始纹理自动选择 JPEG/PNG/WebP |
| `export_embed_images` | `True` | 纹理数据嵌入 GLB 文件，无需外部贴图 |
| `export_draco_mesh_compression_enable` | `True` | 启用 Draco 网格压缩 |
| `export_draco_mesh_compression_level` | `6` | 压缩级别：0=最快，10=最小（推荐 6） |
| `export_draco_position_quantization` | `14` | 顶点位置量化精度（bit），默认 14 |
| `export_draco_normal_quantization` | `10` | 法线量化精度（bit），默认 10 |
| `export_draco_texcoord_quantization` | `12` | UV 坐标量化精度（bit），默认 12 |
| `export_yup` | `True` | Y 轴朝上，符合 glTF 标准 |
| `export_materials` | `'EXPORT'` | 导出所有材质/纹理引用 |

## 单位校准流程

脚本在导出前自动执行：

1. **场景单位系统** → 设为 `METRIC`（公制）
2. **长度单位** → `METERS`（米）
3. **单位缩放** → `1.0`（1 Blender Unit = 1 米）
4. **冻结变换** → 对所有 Mesh 物体应用 `Apply Scale`

确保模型在后续 Three.js / Remotion 中加载时尺寸一致。

## 自检清单

导出后逐项检查：

- [ ] GLB 文件大小合理（非 0 字节）
- [ ] 用 [glTF Viewer](https://gltf-viewer.donmccurdy.com/) 拖入检查渲染正常
- [ ] 纹理/颜色显示正确（非纯白）
- [ ] 网格面数符合预期
- [ ] 模型方向正确（Y 轴朝上，无倒置）
- [ ] 无破面、黑面

## 常见问题

**Q: `export_draco_mesh_compression_enable` 报错？**
A: Blender 3.4+ 已内置 Draco，无需额外安装。

**Q: 纹理导出为紫色/黑色？**
A: 检查材质节点中是否使用了 Blender 专有节点（如 `ShaderNodeBsdfPrincipled` 中的非标准输入），glTF 只支持 PBR 金属/粗糙度工作流。
