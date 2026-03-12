import { act, renderHook } from '@testing-library/react';
import { useCountUp } from '@/hooks/useCountUp';

// Minimal rAF stub
let rafCallbacks: Map<number, FrameRequestCallback> = new Map();
let rafId = 0;

beforeEach(() => {
  rafCallbacks = new Map();
  rafId = 0;
  global.requestAnimationFrame = (cb: FrameRequestCallback) => {
    const id = ++rafId;
    rafCallbacks.set(id, cb);
    return id;
  };
  global.cancelAnimationFrame = (id: number) => {
    rafCallbacks.delete(id);
  };
});

function flush(timestamp = 1000) {
  const cbs = [...rafCallbacks.values()];
  rafCallbacks.clear();
  for (const cb of cbs) cb(timestamp);
}

describe('useCountUp', () => {
  it('starts at the initial target value', () => {
    const { result } = renderHook(() => useCountUp(42));
    expect(result.current).toBe(42);
  });

  it('returns target immediately when duration is 0', () => {
    const { result } = renderHook(() => useCountUp(100, 0));
    act(() => flush());
    expect(result.current).toBe(100);
  });

  it('animates toward target over multiple frames', () => {
    const { result } = renderHook(() => useCountUp(100, 800));
    // First frame: startTime = null → sets start, schedules next frame
    act(() => flush(0));
    // Mid animation (400ms elapsed = 50% progress)
    act(() => flush(400));
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);
  });

  it('reaches target after full duration', () => {
    const { result } = renderHook(() => useCountUp(100, 800));
    act(() => flush(0));
    act(() => flush(800)); // full duration elapsed
    expect(result.current).toBe(100);
  });

  it('restarts from current displayed value on target change', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useCountUp(target, 800),
      { initialProps: { target: 100 } },
    );
    // Advance animation to ~50
    act(() => flush(0));
    act(() => flush(400)); // ~50% through
    const mid = result.current;
    expect(mid).toBeGreaterThan(0);

    // Change target — should restart from mid, not 0
    rerender({ target: 200 });
    act(() => flush(0)); // re-triggers effect, new start = mid
    const afterReset = result.current;
    expect(afterReset).toBe(mid); // first frame after target change: still at mid
  });
});
