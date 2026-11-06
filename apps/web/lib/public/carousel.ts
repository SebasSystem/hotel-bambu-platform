/** Hero carousel state (mockup autoplay 5.5 s, pause toggle, reduced motion starts paused). */
export interface CarouselState {
  index: number;
  count: number;
  paused: boolean;
}

export type CarouselAction =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'goto'; index: number }
  | { type: 'tick' }
  | { type: 'toggle' }
  | { type: 'pause' };

export const CAROUSEL_INTERVAL_MS = 5500;

export function initialCarousel(count: number, reducedMotion: boolean): CarouselState {
  return { index: 0, count, paused: reducedMotion || count < 2 };
}

const wrap = (index: number, count: number) => ((index % count) + count) % count;

export function carouselReducer(state: CarouselState, action: CarouselAction): CarouselState {
  if (state.count < 2) return { ...state, index: 0, paused: true };
  switch (action.type) {
    case 'next':
      return { ...state, index: wrap(state.index + 1, state.count) };
    case 'prev':
      return { ...state, index: wrap(state.index - 1, state.count) };
    case 'goto':
      return { ...state, index: wrap(action.index, state.count) };
    case 'tick':
      return state.paused ? state : { ...state, index: wrap(state.index + 1, state.count) };
    case 'toggle':
      return { ...state, paused: !state.paused };
    case 'pause':
      return state.paused ? state : { ...state, paused: true };
  }
}
