import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
// 和逐帧 HTML 那条路共用同一个缓动库——换渲染器不该重写运动。
import {easeOut, easeInOut, window_, pulse, flash, spring, mix} from '../easing.mjs';

const SOURCE: [number, number] = [540, 547];
const SLOTS: [number, number][] = [[1010, 560], [1240, 542], [1470, 525], [1700, 508]];
const MERGE: [number, number] = [1300, 528];
const NAMES = ['网站', 'GitHub', '小红书', '公众号'];
const COLORS = ['#4E93D8', '#3B4FC0', '#F0822D', '#E8A93A'];
const CARD_ASPECT = 408 / 730;

export const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, width, height} = useVideoConfig();
  // 唯一的区别: t 从当前帧算出来, 而不是由外层循环喂进来。
  const t = frame / (durationInFrames - 1);

  const converge = easeOut(window_(t, 0.24, 0.32), 2.4);
  const overlap = window_(t, 0.52, 0.16);
  const snap = flash(t, 0.575, 0.03);
  const breath = pulse(t, 0.9);
  const tighten = easeInOut(window_(t, 0.5, 0.42));
  const zoom = mix(1, 1.16, tighten);

  const firstIn = easeOut(window_(t, 0.06, 0.1));
  const firstOut = easeInOut(window_(t, 0.42, 0.1));
  const first = firstIn * (1 - firstOut);
  const second = easeOut(window_(t, 0.6, 0.12));
  const tagAlpha = 1 - easeInOut(window_(t, 0.2, 0.16));

  const cards = SLOTS.map(([sx, sy], i) => {
    let x = mix(sx, MERGE[0], converge);
    let y = mix(sy, MERGE[1], converge);
    x = width / 2 + (x - width / 2) * zoom;
    y = height / 2 + (y - height / 2) * zoom;
    const h = 244 * zoom * (1 + 0.06 * (1 - spring(window_(t, 0.24, 0.32))));
    return {i, x, y, h, opacity: i === 0 ? 1 : 1 - 0.82 * easeOut(overlap)};
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#0b1a35', fontFamily: "'PingFang SC', sans-serif"}}>
      <Img src={staticFile('shot/plate.png')} style={{
        position: 'absolute', left: '50%', top: '50%', width, height, objectFit: 'cover',
        transform: `translate(-50%,-50%) scale(${zoom})`, filter: 'brightness(.82)',
      }} />
      <div style={{
        position: 'absolute', left: SOURCE[0], top: SOURCE[1], width: 470, height: 470,
        transform: 'translate(-50%,-50%)', mixBlendMode: 'screen',
        background: `radial-gradient(circle,rgba(150,225,255,${0.2 + 0.2 * breath}) 0%,`
          + `rgba(80,175,255,${0.09 + 0.09 * breath}) 38%,rgba(0,0,0,0) 68%)`,
      }} />
      {cards.map((c) => (
        <Img key={c.i} src={staticFile('shot/card.png')} style={{
          position: 'absolute', left: c.x, top: c.y, height: c.h, width: c.h * CARD_ASPECT,
          opacity: c.opacity, transform: 'translate(-50%,-50%)',
          filter: 'drop-shadow(0 16px 34px rgba(0,0,0,.55))',
        }} />
      ))}
      <div style={{
        position: 'absolute', left: MERGE[0], top: MERGE[1], width: 820, height: 820,
        transform: 'translate(-50%,-50%)', mixBlendMode: 'screen', pointerEvents: 'none',
        background: `radial-gradient(circle,rgba(190,240,255,${0.55 * snap}) 0%,`
          + `rgba(90,190,255,${0.22 * snap}) 40%,rgba(0,0,0,0) 70%)`,
      }} />
      {tagAlpha > 0.02 && cards.map((c) => (
        <div key={c.i} style={{
          position: 'absolute', left: Math.min(Math.max(c.x, 190), width - 190),
          top: c.y - (210 + (c.i % 2 ? 74 : 0)), transform: 'translate(-50%,-100%)',
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 28px',
          borderRadius: 999, background: 'rgba(8,18,40,.88)',
          border: `2px solid ${COLORS[c.i]}`, color: '#EAF2FB', fontSize: 42,
          letterSpacing: 1, whiteSpace: 'nowrap', opacity: tagAlpha,
          boxShadow: `0 0 26px ${COLORS[c.i]}77`,
        }}>
          <i style={{width: 13, height: 13, borderRadius: '50%', background: COLORS[c.i], display: 'block'}} />
          {NAMES[c.i]}
        </div>
      ))}
      <Caption opacity={first} title="四份摊开来看，内容都很寡淡" sub="语言不通顺，完全没法读" />
      <Caption opacity={second} title="没有约束，AI 给你的就是均值" sub="跟它许愿，换不来一篇好文章" lift />
    </AbsoluteFill>
  );
};

const Caption: React.FC<{opacity: number; title: string; sub: string; lift?: boolean}> =
  ({opacity, title, sub, lift}) => (
    <div style={{
      position: 'absolute', left: 120, bottom: 104, opacity,
      transform: lift ? `translateY(${(1 - opacity) * 18}px)` : undefined,
    }}>
      <b style={{display: 'block', fontSize: 64, fontWeight: 600, color: '#F1F6FC',
        letterSpacing: 3, textShadow: '0 4px 26px rgba(0,0,0,.7)'}}>{title}</b>
      <span style={{display: 'block', marginTop: 16, fontSize: 33, fontWeight: 300,
        color: '#A9BFDC', letterSpacing: 2, textShadow: '0 2px 18px rgba(0,0,0,.65)'}}>{sub}</span>
    </div>
  );
