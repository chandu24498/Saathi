/**
 * Tests for src/lib/utils.ts
 *
 * Covers:
 *  - cn() merging class names
 *  - cn() with conditional classes
 *  - cn() with no arguments
 *  - cn() properly resolving tailwind conflicts
 */

import { cn } from '../utils';

describe('cn utility', () => {
  it('merges simple class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });

  it('handles conditional classes (falsy values)', () => {
    const result = cn('base', false && 'hidden', undefined, null, 'visible');
    expect(result).toContain('base');
    expect(result).toContain('visible');
    expect(result).not.toContain('hidden');
  });

  it('returns empty string with no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('resolves tailwind conflicts by keeping the last one', () => {
    // twMerge should resolve p-4 vs p-2 → p-2
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('handles array-style inputs via clsx', () => {
    const result = cn(['foo', 'bar']);
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });

  it('handles object-style conditional inputs', () => {
    const result = cn({ 'text-red': true, 'text-blue': false });
    expect(result).toContain('text-red');
    expect(result).not.toContain('text-blue');
  });
});
