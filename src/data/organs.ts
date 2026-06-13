import type { OrganCategory, OrganItem, ViewPreset } from '../types';

/** 按人体系统分类的器官目录 */
export const organCategories: OrganCategory[] = [
  {
    id: 'circulatory',
    name: '循环系统',
    icon: '❤️',
    children: [
      {
        id: 'heart',
        name: '心脏',
        nameEn: 'Heart',
        modelFile: 'heart.glb',
        description: '心脏是循环系统的动力器官，位于胸腔纵隔内，约拳头大小，通过节律性收缩将血液泵送至全身。分为左心房、左心室、右心房、右心室四个腔室。',
        params: [
          { label: '重量', value: '250-350g' },
          { label: '心率', value: '60-100 次/分' },
          { label: '位置', value: '胸腔纵隔，偏左' },
        ],
      },
      {
        id: 'blood_vessel',
        name: '血管',
        nameEn: 'Blood Vessel',
        modelFile: 'blood_vessel.glb',
        description: '血管分为动脉、静脉和毛细血管三类，构成人体最庞大的运输网络，总长度约10万公里，负责输送血液、氧气和营养物质。',
        params: [
          { label: '总长度', value: '约 100,000 km' },
          { label: '类型', value: '动脉 / 静脉 / 毛细血管' },
        ],
      },
    ],
  },
  {
    id: 'nervous',
    name: '神经系统',
    icon: '🧠',
    children: [
      {
        id: 'brain',
        name: '大脑',
        nameEn: 'Brain',
        modelFile: 'brain.glb',
        description: '大脑是中枢神经系统的主要部分，约含860亿个神经元，负责思维、记忆、感知、语言和运动控制等高级神经功能。表面布满沟回（脑沟和脑回）。',
        params: [
          { label: '重量', value: '1300-1400g' },
          { label: '神经元', value: '约 860 亿个' },
          { label: '分区', value: '额叶 / 顶叶 / 颞叶 / 枕叶' },
        ],
      },
      {
        id: 'neuron',
        name: '神经元',
        nameEn: 'Neuron',
        modelFile: 'neuron.glb',
        description: '神经元是神经系统的基本结构和功能单位，由胞体、树突和轴突组成，通过电化学信号传递信息，形成复杂的神经网络。',
        params: [
          { label: '数量', value: '约 860 亿（大脑）' },
          { label: '结构', value: '胞体 / 树突 / 轴突' },
          { label: '信号速度', value: '0.5-120 m/s' },
        ],
      },
    ],
  },
  {
    id: 'respiratory',
    name: '呼吸系统',
    icon: '🫁',
    children: [
      {
        id: 'lung',
        name: '肺',
        nameEn: 'Lung',
        modelFile: 'lung.glb',
        description: '肺是呼吸系统的主要器官，位于胸腔内，左右各一，负责气体交换——吸入氧气、排出二氧化碳。成人肺泡总面积约70-100平方米。',
        params: [
          { label: '重量', value: '右肺 ~600g / 左肺 ~500g' },
          { label: '肺泡面积', value: '70-100 m²' },
          { label: '分叶', value: '右肺三叶 / 左肺二叶' },
        ],
      },
    ],
  },
  {
    id: 'digestive',
    name: '消化系统',
    icon: '🫄',
    children: [
      {
        id: 'liver',
        name: '肝脏',
        nameEn: 'Liver',
        modelFile: 'liver.glb',
        description: '肝脏是人体最大的实质性内脏器官，位于右上腹，具有代谢、解毒、合成蛋白质、分泌胆汁等500多种功能。是唯一具有再生能力的内脏器官。',
        params: [
          { label: '重量', value: '1200-1500g' },
          { label: '位置', value: '右上腹，膈下' },
          { label: '功能', value: '代谢 / 解毒 / 合成 / 储血' },
        ],
      },
    ],
  },
  {
    id: 'urinary',
    name: '泌尿系统',
    icon: '🫘',
    children: [
      {
        id: 'kidney',
        name: '肾脏',
        nameEn: 'Kidney',
        modelFile: 'kidney.glb',
        description: '肾脏位于腹膜后脊柱两侧，形似蚕豆，每分约过滤1.2升血液，生成原尿，最终排出约1-2升终尿。同时调节水电解质平衡和血压。',
        params: [
          { label: '重量', value: '120-150g（单个）' },
          { label: '大小', value: '约 10×5×3 cm' },
          { label: '肾单位', value: '约 100 万/肾' },
        ],
      },
    ],
  },
  {
    id: 'cells',
    name: '细胞层面',
    icon: '🔬',
    children: [
      {
        id: 'cell',
        name: '人体细胞',
        nameEn: 'Human Cell',
        modelFile: 'cell.glb',
        description: '细胞是人体结构和功能的基本单位，由细胞膜、细胞质和细胞核构成。人体约含37万亿个细胞，分200多种类型，各司其职。',
        params: [
          { label: '总数', value: '约 37 万亿个' },
          { label: '类型', value: '200+ 种' },
          { label: '大小', value: '10-100 μm' },
        ],
      },
    ],
  },
];

/** 所有器官平铺列表（用于快速查找） */
export const allOrgans: OrganItem[] = organCategories.flatMap((c) => c.children);

/** 根据 ID 查找器官 */
export function findOrgan(id: string): OrganItem | undefined {
  return allOrgans.find((o) => o.id === id);
}

/** 视角预设 */
export const viewPresets: ViewPreset[] = [
  { name: 'front', label: '正面', position: [0, 0, 6] },
  { name: 'back', label: '背面', position: [0, 0, -6] },
  { name: 'left', label: '左侧', position: [-6, 0, 0] },
  { name: 'right', label: '右侧', position: [6, 0, 0] },
  { name: 'top', label: '顶部', position: [0, 6, 0.1] },
  { name: 'bottom', label: '底部', position: [0, -6, 0.1] },
];

/** 默认场景功能开关 */
export const defaultSceneFeatures = {
  wireframe: false,
  transparent: false,
  transparency: 0.3,
  clipping: false,
  autoRotate: true,
  showGrid: true,
  showLabels: true,
};
