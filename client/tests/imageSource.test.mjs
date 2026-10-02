import test from 'node:test';
import assert from 'node:assert/strict';
import { dataUrlToBlob, imageSourceToBlob } from '../src/services/api.js';

test('decodes an explicitly base64 image data URL', async () => {
  const blob = dataUrlToBlob('data:text/plain;base64,aGVsbG8=');
  assert.equal(blob.type, 'text/plain');
  assert.equal(await blob.text(), 'hello');
});

test('loads the bundled river-valley sample path through fetch instead of atob', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return new Response(new Uint8Array([137, 80, 78, 71]), { status: 200, headers: { 'Content-Type': 'image/png' } });
  };

  try {
    const blob = await imageSourceToBlob('/samples/river_valley_demo.png');
    assert.equal(requestedUrl, '/samples/river_valley_demo.png');
    assert.equal(blob.type, 'image/png');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('reports malformed base64 image data without leaking an atob error', async () => {
  await assert.rejects(
    imageSourceToBlob('data:image/png;base64,/samples/river_valley_demo.png'),
    /source image data is invalid or corrupted/i,
  );
});
