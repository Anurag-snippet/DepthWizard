import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeAiHealthStatus } from '../src/services/api.js';

test('frontend health helper understands ready state', () => {
  const result = normalizeAiHealthStatus({ status: 'ready', online: true });
  assert.equal(result.status, 'ready');
  assert.equal(result.online, true);
});

test('frontend health helper understands waking_up state', () => {
  const result = normalizeAiHealthStatus({ status: 'waking_up', message: 'AI service is waking up.' });
  assert.equal(result.status, 'waking_up');
  assert.equal(result.online, false);
});

test('frontend health helper understands loading state', () => {
  const result = normalizeAiHealthStatus({ status: 'loading', message: 'AI model is still initializing.' });
  assert.equal(result.status, 'loading');
  assert.equal(result.online, false);
});

test('frontend health helper understands unavailable state', () => {
  const result = normalizeAiHealthStatus({ status: 'unavailable', message: 'AI service is currently unavailable.' });
  assert.equal(result.status, 'unavailable');
  assert.equal(result.online, false);
});

test('frontend health helper understands failed state', () => {
  const result = normalizeAiHealthStatus({ status: 'failed', message: 'AI model could not be initialized.' });
  assert.equal(result.status, 'failed');
  assert.equal(result.online, false);
});
