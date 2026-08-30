import {useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * 一拍内部的归一化时间, 0 到 1。
 *
 * 这是逐帧 HTML 与 Remotion 之间唯一需要改的东西: 那边 t 由外层循环喂进来,
 * 这边从当前帧算出来。其余的缓动、编排、图层写法完全一致。
 */
export const useShotTime = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return durationInFrames > 1 ? frame / (durationInFrames - 1) : 0;
};
