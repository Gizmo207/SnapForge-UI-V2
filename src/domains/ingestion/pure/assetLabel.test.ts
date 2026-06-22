import { describe, it, expect } from 'vitest';
import { assetLabel } from './assetLabel';

describe('assetLabel', () => {
  it('labels the ProfileCard slots in plain English', () => {
    expect(assetLabel('/path/to/avatar.jpg')).toBe('Profile photo / avatar');
    expect(assetLabel('/assets/demo/iconpattern.png')).toBe('Holographic overlay texture (optional)');
  });

  it('recognizes common asset kinds', () => {
    expect(assetLabel('/models/duck.glb')).toBe('3D model');
    expect(assetLabel('fonts/Inter.woff2')).toBe('Font');
    expect(assetLabel('grain.webp')).toBe('Grain texture (optional)');
    expect(assetLabel('hero-bg.jpg')).toBe('Background image');
    expect(assetLabel('logo.svg')).toBe('Logo');
  });

  it('falls back to the filename when nothing matches', () => {
    expect(assetLabel('/foo/bar/mystery.dat')).toBe('mystery.dat');
  });
});
