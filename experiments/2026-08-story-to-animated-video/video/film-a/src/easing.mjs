// 逐帧动画用的缓动与时序函数。
//
// 全部接受并返回 0..1。写镜头时先把时间轴切成若干段 (window)，
// 再给每段套一条缓动曲线，最后把结果映射到位置、透明度或模糊半径上。

/** 夹到 0..1。所有函数都先过这一步, 越界的输入不会产生越界的输出。 */
export const clamp01 = (value) => Math.max(0, Math.min(1, value));

/**
 * 取一段时间窗内的进度。t 在 [start, start+span] 之外时返回 0 或 1。
 * 这是编排镜头的主力: 每个动作声明自己何时开始、持续多久, 段与段可以重叠。
 */
export const window_ = (t, start, span) => clamp01((t - start) / span);

/** 缓出。开头快结尾慢, 适合物体飞入落位——多数入场都该用它。 */
export const easeOut = (t, power = 3) => 1 - Math.pow(1 - clamp01(t), power);

/** 缓入。开头慢结尾快, 适合退场和加速离场。 */
export const easeIn = (t, power = 2.2) => Math.pow(clamp01(t), power);

/** 缓入缓出。适合摄影机推拉这类两端都该减速的运动。 */
export const easeInOut = (t) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/**
 * 弹簧。会越过 1 再回落, 用来给落位加一点过冲。
 * 直接当位置用会晃得太夸张, 通常取 (1 - spring(t)) 去调一个很小的缩放量。
 */
export const spring = (t, stiffness = 6.5, frequency = 9) => {
  const x = clamp01(t);
  return 1 - Math.exp(-stiffness * x) * Math.cos(frequency * x);
};

/** 正弦脉动, 返回 0..1。给发光体做呼吸, 让静止的画面不死。 */
export const pulse = (t, cyclesPerUnit = 2) =>
  0.5 + 0.5 * Math.sin(t * Math.PI * 2 * cyclesPerUnit);

/**
 * 高斯闪光。在 center 处冲到 1, 两侧迅速衰减。
 * 用于合拢、命中、切换这类需要一个瞬间强调的时刻。width 越小闪得越干脆。
 */
export const flash = (t, center, width = 0.022) =>
  Math.exp(-Math.pow((t - center) / width, 2));

/**
 * 逐个错开。第 index 个元素比第一个晚 delay 开始。
 * 一组同类元素同时入场会糊成一团, 错开之后才数得清有几个。
 */
export const stagger = (t, index, delay = 0.16, span = 0.4) =>
  clamp01((t - index * delay) / span);

/** 线性插值。 */
export const mix = (from, to, k) => from + (to - from) * k;

/** 二维插值, 省得每个坐标写两遍。 */
export const mixPoint = ([x1, y1], [x2, y2], k) => [mix(x1, x2, k), mix(y1, y2, k)];
