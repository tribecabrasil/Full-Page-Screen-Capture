import assert from 'node:assert/strict';
import test from 'node:test';

import { formatMessage } from '../src/shared/format-message.js';

test('formatMessage returns message without substitutions', () => {
  assert.equal(formatMessage({ message: 'Hello' }), 'Hello');
});

test('formatMessage replaces named placeholders', () => {
  const entry = {
    message: 'Part $PART$ of $PARTS$',
    placeholders: {
      part: { content: '$1' },
      parts: { content: '$2' },
    },
  };
  assert.equal(formatMessage(entry, ['2', '5']), 'Part 2 of 5');
});

test('formatMessage handles uppercase placeholder tokens', () => {
  const entry = {
    message: 'Capturing in $SECONDS$ s...',
    placeholders: {
      seconds: { content: '$1' },
    },
  };
  assert.equal(formatMessage(entry, ['3']), 'Capturing in 3 s...');
});