import { describe, expect, it } from 'vitest';
import { cn } from './classes';

describe('cn', () => {
  it('garde une taille de texte du projet et une couleur côte à côte', () => {
    expect(cn('text-md', 'text-foreground')).toBe('text-md text-foreground');
    expect(cn('text-2xs', 'text-cat-nature-foreground')).toBe(
      'text-2xs text-cat-nature-foreground',
    );
  });

  it('remplace une taille de texte par la suivante', () => {
    expect(cn('text-md', 'text-lg')).toBe('text-lg');
  });

  it('remplace un arrondi, une ombre et une superposition du projet', () => {
    expect(cn('rounded-lg', 'rounded-pill')).toBe('rounded-pill');
    expect(cn('shadow-xs', 'shadow-card')).toBe('shadow-card');
    expect(cn('z-sheet', 'z-toast')).toBe('z-toast');
  });

  it('ne confond pas deux familles différentes', () => {
    expect(cn('rounded-pill', 'shadow-card', 'z-sheet')).toBe('rounded-pill shadow-card z-sheet');
  });
});
