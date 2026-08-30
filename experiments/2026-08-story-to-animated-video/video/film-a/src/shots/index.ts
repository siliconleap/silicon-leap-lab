import type React from 'react';
import {S05} from './S05';

// 镜头号 → 组件。新增一拍就在这里登记一行。
// 没有登记的拍号会被跳过, 所以可以先只做前三拍再逐步补齐。
export const SHOTS: Record<number, React.FC> = {
  5: S05,
};
