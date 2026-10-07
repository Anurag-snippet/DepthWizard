import test from 'node:test';
import assert from 'node:assert/strict';

import { mapAiHealthStatus } from '../src/services/aiService.js';

test('backend maps cold-start timeout to waking_up', () => {
  const result = mapAiHealthStatus({ status: 'waking_up', message: 'AI service is waking up from Render standby.' });
  assert.equal(result.status, 'waking_up');
  assert.equal(result.success, false);
});

test('backend maps FastAPI alive + model loading correctly', () => {
  const result = mapAiHealthStatus({ status: 'loading', message: 'AI model is still initializing.' });
  assert.equal(result.status, 'loading');
  assert.equal(result.success, false);
});

test('backend maps ready correctly', () => {
  const result = mapAiHealthStatus({ status: 'ready', model_loaded: true });
  assert.equal(result.status, 'ready');
  assert.equal(result.success, true);
});
