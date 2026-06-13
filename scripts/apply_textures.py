"""
Blender 纹理材质自动赋值脚本
==============================
用途：将 SD 生成的无缝纹理贴图自动赋给对应器官模型
调用：blender --background --python apply_textures.py

使用流程：
  1. 用 SD 生成纹理贴图 → 放入 raw_model/textures/
  2. 运行本脚本 → 自动赋材质
  3. 重新导出 GLB（运行 blender_export_glb.py）
"""

import bpy
import os
from pathlib import Path


# ============================================================
# 配置 —— 纹理文件与模型名称映射
# ============================================================
# 格式：{"模型关键词": "纹理文件名.png"}
# 脚本会匹配 Blend 文件名中包含关键词的模型
TEXTURE_MAP = {
    "heart":         "heart_texture.png",
    "brain":         "brain_texture.png",
    "lung":          "lung_texture.png",
    "liver":         "liver_texture.png",
    "kidney":        "kidney_texture.png",
    "cell":          "cell_texture.png",
    "neuron":        "neuron_texture.png",
    "blood_vessel":  "blood_vessel_texture.png",
    "blood":         "blood_vessel_texture.png",
}

# 纹理目录（相对于 raw_model）
TEXTURE_DIR = r"D:\3D人体器官细胞漫游项目\raw_model\textures"
SOURCE_DIR = r"D:\3D人体器官细胞漫游项目\raw_model"

# 如果 D 盘不可用，自动适配工作区
if not os.path.exists(SOURCE_DIR):
    workspace_root = Path(__file__).resolve().parent.parent
    TEXTURE_DIR = str(workspace_root / "raw_model" / "textures")
    SOURCE_DIR = str(workspace_root / "raw_model")


def find_texture_for_model(blend_name: str) -> str | None:
    """根据 Blend 文件名匹配对应纹理"""
    name_lower = blend_name.lower()
    for keyword, texture_file in TEXTURE_MAP.items():
        if keyword in name_lower:
            texture_path = os.path.join(TEXTURE_DIR, texture_file)
            if os.path.exists(texture_path):
                return texture_path
    return None


def apply_pbr_material(obj, texture_path: str):
    """给物体创建 PBR 材质并赋纹理"""
    # 创建新材质
    mat = bpy.data.materials.new(name=f"MAT_{obj.name}")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # 清除默认节点
    nodes.clear()

    # 创建 PBR 节点组
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    bsdf.inputs['Roughness'].default_value = 0.4
    bsdf.inputs['Specular IOR Level'].default_value = 0.15

    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (300, 0)

    # 纹理节点
    tex_image = nodes.new(type='ShaderNodeTexImage')
    tex_image.location = (-300, 0)

    # 加载纹理
    img = bpy.data.images.load(texture_path)
    tex_image.image = img

    # 连接：纹理颜色 → BSDF 基础色
    links.new(tex_image.outputs['Color'], bsdf.inputs['Base Color'])

    # 连接：BSDF → 输出
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

    # 赋值给物体
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

    print(f"  [MAT] {obj.name} ← {os.path.basename(texture_path)}")


def process_blend_file(blend_path: str):
    """处理单个 Blend 文件"""
    # 清空场景
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # 打开
    bpy.ops.wm.open_mainfile(filepath=blend_path)

    blend_name = Path(blend_path).stem
    texture_path = find_texture_for_model(blend_name)

    if not texture_path:
        print(f"  [SKIP] {blend_name} - 未找到匹配纹理")
        return False

    # 遍历所有 Mesh 物体，赋材质
    applied = 0
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            apply_pbr_material(obj, texture_path)
            applied += 1

    if applied > 0:
        # 保存 Blend 文件
        bpy.ops.wm.save_mainfile()
        print(f"  [OK] {blend_name} - 已为 {applied} 个物体赋材质")
        return True
    else:
        print(f"  [WARN] {blend_name} - 无 Mesh 物体")
        return False


def main():
    os.makedirs(TEXTURE_DIR, exist_ok=True)

    blend_files = sorted(Path(SOURCE_DIR).glob("*.blend"))

    if not blend_files:
        print("[WARN] 未找到 .blend 文件")
        return

    print("=" * 50)
    print("  纹理材质自动赋值")
    print(f"  源目录：{SOURCE_DIR}")
    print(f"  纹理目录：{TEXTURE_DIR}")
    print("=" * 50)

    for bf in blend_files:
        process_blend_file(str(bf))

    print("\n完成。请运行 blender_export_glb.py 重新导出 GLB。")


if __name__ == "__main__":
    main()
