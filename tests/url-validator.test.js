import assert from 'node:assert/strict';
import test from 'node:test';

import { validateCaptureUrl } from '../src/shared/url-validator.js';

test('validateCaptureUrl accepts https pages', () => {
  assert.deepEqual(validateCaptureUrl('https://example.com/page'), { valid: true });
});

test('validateCaptureUrl accepts http and file urls', () => {
  assert.deepEqual(validateCaptureUrl('http://localhost:3000'), { valid: true });
  assert.deepEqual(validateCaptureUrl('file:///tmp/page.html'), { valid: true });
});

test('validateCaptureUrl rejects empty urls', () => {
  assert.deepEqual(validateCaptureUrl(''), { valid: false, reason: 'no-url' });
});

test('validateCaptureUrl rejects restricted browser urls', () => {
  assert.deepEqual(validateCaptureUrl('chrome://settings'), {
    valid: false,
    reason: 'restricted',
  });
  assert.deepEqual(validateCaptureUrl('chrome-extension://abc/popup.html'), {
    valid: false,
    reason: 'restricted',
  });
  assert.deepEqual(validateCaptureUrl('https://chromewebstore.google.com/detail/foo'), {
    valid: false,
    reason: 'restricted',
  });
});

test('validateCaptureUrl rejects unsupported schemes', () => {
  assert.deepEqual(validateCaptureUrl('blob:https://example.com/uuid'), {
    valid: false,
    reason: 'unsupported',
  });
});