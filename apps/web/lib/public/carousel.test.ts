import { describe, expect, it } from 'vitest';
import { carouselReducer, initialCarousel } from './carousel';

describe('carouselReducer', () => {
  it('starts on the first slide, playing unless motion is reduced or there is one slide', () => {
    expect(initialCarousel(3, false)).toEqual({ index: 0, count: 3, paused: false });
    expect(initialCarousel(3, true).paused).toBe(true);
    expect(initialCarousel(1, false).paused).toBe(true);
  });

  it('wraps next and previous around the ends', () => {
    let state = initialCarousel(3, false);
    state = carouselReducer(state, { type: 'prev' });
    expect(state.index).toBe(2);
    state = carouselReducer(state, { type: 'next' });
    expect(state.index).toBe(0);
    expect(carouselReducer(state, { type: 'goto', index: 7 }).index).toBe(1);
  });

  it('advances on tick only while playing', () => {
    const playing = initialCarousel(2, false);
    expect(carouselReducer(playing, { type: 'tick' }).index).toBe(1);
    const paused = carouselReducer(playing, { type: 'toggle' });
    expect(paused.paused).toBe(true);
    expect(carouselReducer(paused, { type: 'tick' }).index).toBe(0);
    expect(carouselReducer(paused, { type: 'toggle' }).paused).toBe(false);
  });

  it('pauses on demand (reduced motion detected after hydration)', () => {
    const state = carouselReducer(initialCarousel(3, false), { type: 'pause' });
    expect(state.paused).toBe(true);
    expect(carouselReducer(state, { type: 'pause' }).paused).toBe(true);
  });

  it('never plays a single slide', () => {
    const single = initialCarousel(1, false);
    expect(carouselReducer(single, { type: 'toggle' }).paused).toBe(true);
    expect(carouselReducer(single, { type: 'next' }).index).toBe(0);
  });
});
