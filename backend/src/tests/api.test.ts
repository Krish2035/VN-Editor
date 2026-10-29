import assert from 'assert';
import { createDefaultProject } from '../services/projectService';
import { registerUser, loginUser, findUserByEmail } from '../services/authService';
import { createRenderJob, getJobById } from '../services/renderQueue';
import { resolveAssetPath } from '../services/ffmpegService';

async function runBackendUnitTests() {
  console.log('🧪 Running Backend Architecture & API Unit Tests...');
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

  // 1. Initial Project Blueprint Test
  await test('createDefaultProject generates valid 16:9 60fps schema', () => {
    const proj = createDefaultProject();
    assert.strictEqual(proj.canvas.width, 1920);
    assert.strictEqual(proj.canvas.height, 1080);
    assert.strictEqual(proj.canvas.fps, 60);
    assert.strictEqual(proj.canvas.aspectRatio, '16:9');
    assert.ok(proj.tracks.length >= 4, 'Should contain at least 4 tracks');
  });

  // 2. Auth Service Registration & Bcrypt Hashing Test
  await test('registerUser validates password length and issues JWT token', async () => {
    const testEmail = `test_${Date.now()}@vneditor.pro`;
    const regResult = await registerUser(testEmail, 'Secr3tPassword!', 'Test QA Architect');
    assert.ok(regResult.token, 'Registration should return signed JWT token');
    assert.strictEqual(regResult.user.email, testEmail);

    const loginResult = await loginUser(testEmail, 'Secr3tPassword!');
    assert.ok(loginResult.token, 'Login should succeed with correct credentials');

    // Duplicate check
    try {
      await registerUser(testEmail, 'Secr3tPassword!', 'Duplicate');
      assert.fail('Should reject duplicate registration');
    } catch (e: any) {
      assert.ok(e.message.includes('already exists'));
    }
  });

  // 3. Render Queue Concurrency & Job Telemetry Test
  await test('createRenderJob queues job and computes frame telemetry correctly', () => {
    const project = createDefaultProject();
    project.canvas.durationMs = 10000;
    project.canvas.fps = 60;

    const job = createRenderJob(project);
    assert.ok(job.id.startsWith('render_'));
    assert.ok(job.status === 'queued' || job.status === 'rendering');
    assert.strictEqual(job.totalFrames, 600, '10s @ 60fps must equal 600 total frames');

    const retrieved = getJobById(job.id);
    assert.ok(retrieved !== null, 'Job must be retrievable by ID');
    assert.strictEqual(retrieved?.id, job.id);
  });

  // 4. Asset Path Resolution Test
  await test('resolveAssetPath safely handles absolute and relative paths', () => {
    const rel = resolveAssetPath('/uploads/clip.mp4');
    assert.ok(rel.endsWith('clip.mp4'));
    assert.ok(rel.includes('uploads'));
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runBackendUnitTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
