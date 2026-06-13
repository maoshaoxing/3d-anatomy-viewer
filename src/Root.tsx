import React from 'react';
import { Composition } from 'remotion';
import { RemotionScene } from './RemotionScene';

// 可用模型列表（实际渲染时修改 defaultProps）
const MODELS = [
  'heart',
  'brain',
  'lung',
  'liver',
  'kidney',
  'cell',
  'neuron',
  'blood_vessel',
];

export const Root: React.FC = () => {
  return (
    <>
      {MODELS.map((model) => (
        <Composition
          key={model}
          id={`${model}-roam`}
          component={RemotionScene}
          durationInFrames={30 * 60}     // 30fps × 60秒 = 1800帧
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            modelPath: `/models/${model}.glb`,
            modelName: model,
            durationInSeconds: 60,
          }}
        />
      ))}
      {/* 合集：所有模型连续展示 */}
      <Composition
        id="OrganCellRoam"
        component={RemotionScene}
        durationInFrames={30 * 60}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          modelPath: '/models/heart.glb',
          modelName: 'all-organs',
          durationInSeconds: 60,
        }}
      />
    </>
  );
};
