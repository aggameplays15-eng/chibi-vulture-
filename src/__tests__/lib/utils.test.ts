import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const isHidden = false;
    const isVisible = true;
    expect(cn('base', isHidden && 'hidden', isVisible && 'visible')).toBe('base visible');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('merges tailwind conflicting classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
