"""
Blender GLB 批量导出脚本
============================
用途：将 raw_model 目录中的 .blend 文件批量导出为 GLB 格式
适用：Blender 3.6+
调用：blender --background --python blender_export_glb.py

导出参数：
  - 缩放/变换应用：apply_modifiers=True, apply_scale='FBX_ALL'
  - 嵌入纹理：export_image_format='AUTO', export_embed_images=True
  - 网格压缩：export_draco_mesh_compression_enable=True
  - 单位校准：导出前统一缩放至米制 (1 Blender Unit = 1 meter)
"""

import bpy
import os
import sys
from pathlib import Path


# ============================================================
# 配置区 —— 按实际路径修改
# ============================================================
SOURCE_DIR = r"D:\3D人体器官细胞漫游项目\raw_model"
OUTPUT_DIR = r"D:\3D人体器官细胞漫游项目\raw_model"  # GLB 输出到同目录

# 如果脚本在非 D 盘环境运行，可检测并切换
if not os.path.exists(SOURCE_DIR):
    # 备选路径（Workspace 开发环境）
    workspace_root = Path(__file__).resolve().parent.parent
    SOURCE_DIR = str(workspace_root / "raw_model")
    OUTPUT_DIR = SOURCE_DIR


# ============================================================
# 导出参数
# ============================================================
EXPORT_PARAMS = {
    "use_selection": False,          # 导出所有物体
    "export_format": 'GLB',          # GLB 二进制格式
    "export_apply": True,            # 应用修改器
    "export_image_format": 'AUTO',   # 自动选择纹理格式
    "export_texture_dir": '',        # 纹理嵌入 GLB 内
    "export_embed_images": True,     # 嵌入图片纹理
    "export_draco_mesh_compression_enable": True,  # Draco 网格压缩
    "export_draco_mesh_compression_level": 6,       # 压缩级别 (0-10, 6 平衡)
    "export_draco_position_quantization": 14,       # 位置量化位数
    "export_draco_normal_quantization": 10,         # 法线量化位数
    "export_draco_texcoord_quantization": 12,       # UV 量化位数
    "export_yup": True,              # Y 轴朝上（标准 glTF 约定）
    "export_materials": 'EXPORT',    # 导出所有材质
    "export_original_specular": False,
}


def ensure_unit_scale():
    """确保场景单位为米（Metric），单位缩放为 1.0"""
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    # 重要：设置长度单位为米
    scene.unit_settings.length_unit = 'METERS'
    print(f"[UNIT] 场景单位已校准：{scene.unit_settings.length_unit}，缩放={scene.unit_settings.scale_length}")


def export_blend_to_glb(blend_path):
    """将单个 .blend 文件导出为 GLB"""
    # 清空场景
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # 打开 blend 文件
    bpy.ops.wm.open_mainfile(filepath=str(blend_path))

    # 校准单位
    ensure_unit_scale()

    # 选中所有网格物体
    bpy.ops.object.select_all(action='SELECT')

    # 应用缩放变换（冻结变换）
    for obj in bpy.context.selected_objects:
        if obj.type == 'MESH':
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # 输出路径
    blend_stem = Path(blend_path).stem
    output_path = os.path.join(OUTPUT_DIR, f"{blend_stem}.glb")

    # 执行导出
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        **EXPORT_PARAMS
    )

    # 验证
    if os.path.exists(output_path):
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"[OK] {blend_stem}.blend → {blend_stem}.glb ({size_mb:.2f} MB)")
        return True
    else:
        print(f"[FAIL] {blend_stem}.glb 导出失败：文件未生成")
        return False


def main():
    print("=" * 60)
    print("  Blender GLB 批量导出工具")
    print("=" * 60)
    print(f"  源目录：{SOURCE_DIR}")
    print(f"  输出目录：{OUTPUT_DIR}")
    print(f"  Draco 压缩：启用 (级别 {EXPORT_PARAMS['export_draco_mesh_compression_level']})")
    print(f"  纹理嵌入：{'是' if EXPORT_PARAMS['export_embed_images'] else '否'}")
    print("=" * 60)

    os.makedirs(SOURCE_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    blend_files = sorted(Path(SOURCE_DIR).glob("*.blend"))

    if not blend_files:
        print("[WARN] 未找到 .blend 文件，请将模型放入 raw_model 目录")
        return

    print(f"\n找到 {len(blend_files)} 个 Blend 文件\n")

    success = 0
    fail = 0
    for blend_file in blend_files:
        if export_blend_to_glb(blend_file):
            success += 1
        else:
            fail += 1

    print(f"\n{'=' * 60}")
    print(f"  完成：成功 {success}，失败 {fail}")
    print("=" * 60)


if __name__ == "__main__":
    main()
