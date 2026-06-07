import { describe, expect, it } from 'vitest';
import { appendLookupChunk, shouldAcceptLookupMessage } from '../../lib/lookupStreamState';

describe('lookupStream', () => {
  it('accepts messages matching current requestId and selectionId', () => {
    expect(
      shouldAcceptLookupMessage(
        { requestId: 'request-2', selectionId: 'selection-2' },
        'request-2',
        'selection-2',
      ),
    ).toBe(true);
  });

  it('ignores stale requestId messages', () => {
    expect(
      shouldAcceptLookupMessage(
        { requestId: 'request-1', selectionId: 'selection-2' },
        'request-2',
        'selection-2',
      ),
    ).toBe(false);
  });

  it('ignores stale selectionId messages', () => {
    expect(
      shouldAcceptLookupMessage(
        { requestId: 'request-2', selectionId: 'selection-1' },
        'request-2',
        'selection-2',
      ),
    ).toBe(false);
  });

  it('generates safeHtml for streaming chunks without keeping dangerous markup', () => {
    const result = appendLookupChunk(
      '<p class="text-sm">',
      'hello<script>alert(1)</script><span onclick="x()">world</span></p>',
    );

    expect(result.buffer).toContain('<script>');
    expect(result.safeHtml).toContain('<p class="text-sm">hello<span>world</span></p>');
    expect(result.safeHtml).not.toContain('<script>');
    expect(result.safeHtml).not.toContain('onclick');
  });
});
