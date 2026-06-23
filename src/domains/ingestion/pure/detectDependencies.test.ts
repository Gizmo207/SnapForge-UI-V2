import { describe, it, expect } from 'vitest';
import { detectDependencies } from './detectDependencies';

describe('detectDependencies', () => {
  it('extracts real npm packages, including scoped ones', () => {
    const code = `
      import { motion } from 'framer-motion';
      import confetti from 'canvas-confetti';
      import { Renderer } from 'ogl';
      import { Dialog } from '@radix-ui/react-dialog';
    `;
    expect(detectDependencies(code)).toEqual([
      '@radix-ui/react-dialog',
      'canvas-confetti',
      'framer-motion',
      'ogl',
    ]);
  });

  it('ignores @/ and ~/ path aliases (shadcn/Next convention), not npm packages', () => {
    const code = `
      import { AnimatedCircularProgressBar } from "@/registry/magicui/animated-circular-progress-bar";
      import { cn } from "@/lib/utils";
      import { Button } from "~/components/ui/button";
      import { motion } from "framer-motion";
    `;
    // Only the real package should be detected; the aliases must not appear.
    expect(detectDependencies(code)).toEqual(['framer-motion']);
  });

  it('ignores relative and builtin imports', () => {
    const code = `
      import React from 'react';
      import './styles.css';
      import { thing } from '../shared/thing';
    `;
    expect(detectDependencies(code)).toEqual([]);
  });
});
