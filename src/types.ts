import { Vector3 } from 'three';

/** 器官分类 */
export interface OrganCategory {
  id: string;
  name: string;
  icon: string;
  children: OrganItem[];
}

/** 单个器官/模型项 */
export interface OrganItem {
  id: string;
  name: string;
  nameEn: string;
  modelFile: string;       // GLB 文件名
  thumbnail?: string;       // 缩略图（可选）
  description: string;
  params: OrganParam[];
}

/** 器官参数 */
export interface OrganParam {
  label: string;
  value: string;
}

/** 视角预设 */
export interface ViewPreset {
  name: string;
  label: string;
  position: [number, number, number];
  target?: [number, number, number];
}

/** 高亮信息 */
export interface HighlightInfo {
  id: string;
  name: string;
  position: [number, number, number];
}

/** 剖切平面 */
export interface ClippingPlane {
  axis: 'x' | 'y' | 'z';
  offset: number;
  enabled: boolean;
}

/** 场景功能开关 */
export interface SceneFeatures {
  wireframe: boolean;
  transparent: boolean;
  transparency: number;     // 0-1
  clipping: boolean;
  autoRotate: boolean;
  showGrid: boolean;
  showLabels: boolean;
}
