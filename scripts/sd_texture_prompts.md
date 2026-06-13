# Stable Diffusion 纹理贴图生成 — 提示词模板库

## 使用方式

在 SD WebUI / ComfyUI / API 中填入以下提示词，生成 1024×1024 无缝纹理贴图。

## 通用参数

| 参数 | 值 |
|------|-----|
| 分辨率 | 1024×1024 |
| 采样器 | DPM++ 2M Karras |
| 步数 | 25-30 |
| CFG Scale | 7 |
| 模型 | SDXL / Realistic Vision / epiCRealism |

---

## 器官纹理

### 心脏（Heart）

**正面提示词：**
```
seamless texture of human heart surface tissue, realistic anatomical texture, deep red blood vessels, cardiac muscle fibers, epicardium surface, medical illustration quality, 8K, highly detailed, subsurface scattering, wet glossy organic surface, uniform lighting, tileable texture, no seams, neutral gray background
```

**负面提示词：**
```
blood, gore, wound, cut, text, watermark, frame, border, 3D render, cartoon, stylized, low quality, blurry, distorted
```

---

### 大脑（Brain）

**正面提示词：**
```
seamless texture of human brain cerebral cortex, realistic gyri and sulci pattern, gray matter surface, pinkish-gray organic folds, medical anatomy reference, 8K resolution, highly detailed, tileable seamless texture, uniform soft lighting, neutral background
```

---

### 肺（Lung）

**正面提示词：**
```
seamless texture of human lung tissue surface, spongy alveolar structure, pink porous organic surface, realistic medical anatomy, pleural surface, fine capillary network, 8K, highly detailed, tileable, soft diffused lighting
```

---

### 肝脏（Liver）

**正面提示词：**
```
seamless texture of human liver tissue surface, reddish-brown smooth organic surface, hepatic lobule pattern, realistic medical anatomy, glossy wet look, 8K, highly detailed, tileable seamless, uniform lighting
```

---

### 肾脏（Kidney）

**正面提示词：**
```
seamless texture of human kidney tissue surface, reddish-brown bean-shaped organ, renal cortex texture, granular appearance, realistic medical anatomy, 8K highly detailed, tileable seamless, soft diffused lighting
```

---

## 细胞纹理

### 人体细胞（Human Cell）

**正面提示词：**
```
seamless texture of human cell surface, phospholipid bilayer membrane, translucent organic membrane with embedded protein channels, microscopic view, bioluminescent glow, scientific visualization style, 8K, highly detailed, tileable seamless, dark background
```

---

### 神经元（Neuron）

**正面提示词：**
```
seamless texture of neuron cell body and dendrites network, branching organic structures, synaptic connections, bioluminescent blue-purple glow, scientific microscopy style, 8K, highly detailed, tileable seamless, dark background
```

---

## 后处理建议

生成后建议用以下工具处理：

```bash
# 使用 ImageMagick 确保无缝拼接
magick input.png -roll +512+512 -compose difference output_seamless.png

# 缩放到 2K 用于游戏引擎
magick input.png -resize 2048x2048 output_2k.png
```

## Blender 材质赋值

运行 `scripts/apply_textures.py`（见同名脚本）自动将生成纹理赋给对应模型。
