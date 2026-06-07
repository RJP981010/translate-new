import { describe, expect, it } from 'vitest';
import { sanitizeRichText } from '../../lib/richText';

describe('richText', () => {
  it('keeps allowed tags and class tokens', () => {
    const result = sanitizeRichText(
      '<div class="space-y-2 text-sm unknown"><p><strong>Hello</strong></p></div>',
    );

    expect(result.safeHtml).toContain('<div class="space-y-2 text-sm">');
    expect(result.safeHtml).toContain('<strong>Hello</strong>');
    expect(result.safeHtml).not.toContain('unknown');
  });

  it('removes scripts, event handlers and remote resources', () => {
    const result = sanitizeRichText(
      '<p onclick="alert(1)" style="color:red">Safe</p><script>alert(1)</script><img src="https://example.com/a.png">',
    );

    expect(result.safeHtml).toContain('<p>Safe</p>');
    expect(result.safeHtml).not.toContain('onclick');
    expect(result.safeHtml).not.toContain('style=');
    expect(result.safeHtml).not.toContain('script');
    expect(result.safeHtml).not.toContain('img');
    expect(result.safeHtml).not.toContain('https://example.com');
  });

  it('falls back safely for empty content', () => {
    const result = sanitizeRichText('   ');
    expect(result.safeHtml).toBe('');
    expect(result.status).toBe('fallback');
  });
});
