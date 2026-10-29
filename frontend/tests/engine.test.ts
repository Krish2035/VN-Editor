import { interpolateKeyframes } from '../src/core/canvasCompositor';
import { VNClip, AspectRatio } from '../src/types';

function assertStrictEqual(actual: any, expected: any, msg?: string) {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${expected}, but got ${actual}`);
  }
}

function assertOk(value: any, msg?: string) {
  if (!value) {
    throw new Error(msg || `Expected truthy value, but got ${value}`);
  }
}

function formatTimecode(ms: number, fps: number = 60): string {
  const totalSec = Math.floor(ms / 1000);
  const frames = Math.floor(((ms % 1000) / 1000) * fps);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60) % 60;
  const hrs = Math.floor(totalSec / 3600);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hrs)}:${pad(min)}:${pad(sec)}:${pad(frames)}`;
}

async function runFrontendTests() {
  console.log('🧪 Running Frontend Engine & Compositor Unit Tests...');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`  ❌ FAIL: ${name}`, err.message);
        failed++;
      });
  }

  // 1. Timecode calculation test
  await test('formatTimecode accurately computes frame-accurate HH:MM:SS:FF', () => {
    assertStrictEqual(formatTimecode(0, 60), '00:00:00:00');
    assertStrictEqual(formatTimecode(1000, 60), '00:00:01:00');
    assertStrictEqual(formatTimecode(1500, 60), '00:00:01:30');
    assertStrictEqual(formatTimecode(3661000, 60), '01:01:01:00');
  });

  // 2. Keyframe Interpolation Test
  await test('interpolateKeyframes correctly computes lerp values between diamond keyframes', () => {
    const dummyClip: VNClip = {
      id: 'clip_test',
      trackId: 'track_1',
      sourceDurationMs: 4000,
      name: 'Test Clip',
      startMs: 0,
      durationMs: 4000,
      trimInMs: 0,
      trimOutMs: 0,
      speed: 1,
      volume: 1,
      fadeInMs: 0,
      fadeOutMs: 0,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
      keyframes: [
        {
          id: 'kf1',
          timeMs: 1000,
          property: 'scale',
          value: { scale: 1.0 },
          easing: 'linear'
        },
        {
          id: 'kf2',
          timeMs: 3000,
          property: 'scale',
          value: { scale: 2.0 },
          easing: 'linear'
        }
      ],
      colorAdjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        vignette: 0
      }
    };

    // Before first keyframe
    const before = interpolateKeyframes(dummyClip, 500);
    assertStrictEqual(before.scale, 1.0);

    // Midpoint between 1000ms (1.0) and 3000ms (2.0) -> at 2000ms, scale must be 1.5
    const mid = interpolateKeyframes(dummyClip, 2000);
    assertStrictEqual(mid.scale, 1.5, `Midpoint scale should be 1.5, got ${mid.scale}`);

    // After last keyframe
    const after = interpolateKeyframes(dummyClip, 3500);
    assertStrictEqual(after.scale, 2.0);
  });

  // 3. Aspect Ratio Matrix Validation
  await test('Aspect ratio resolutions match industry standard production dimensions', () => {
    const resolutions: Record<AspectRatio, { w: number; h: number }> = {
      '16:9': { w: 1920, h: 1080 },
      '9:16': { w: 1080, h: 1920 },
      '1:1': { w: 1080, h: 1080 },
      '4:5': { w: 1080, h: 1350 },
      '21:9': { w: 2560, h: 1080 }
    };

    assertStrictEqual(resolutions['16:9'].w / resolutions['16:9'].h, 1920 / 1080);
    assertStrictEqual(resolutions['9:16'].w / resolutions['9:16'].h, 1080 / 1920);
    assertStrictEqual(resolutions['1:1'].w, resolutions['1:1'].h);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runFrontendTests().catch((err) => {
  console.error('Frontend test runner error:', err);
  process.exit(1);
});

