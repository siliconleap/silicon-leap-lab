import React from 'react';
import {Composition} from 'remotion';
import durations from '../shot-durations.json';
import {SHOTS} from './shots';

// 每一拍注册成一个 composition, 时长从配音的 cue 表来。
// 加一拍 = 在 shots/ 下写一个组件并登记进 shots/index.ts, 不动这个文件。
export const FilmRoot: React.FC = () => (
  <>
    {durations.shots.map((plan) => {
      const Shot = SHOTS[plan.shot];
      if (!Shot) return null;
      return (
        <Composition
          key={plan.shot}
          id={`s${plan.shot}`}
          component={Shot}
          durationInFrames={plan.durationInFrames}
          fps={durations.fps}
          width={1920}
          height={1080}
        />
      );
    })}
  </>
);
