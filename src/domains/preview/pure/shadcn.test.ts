import { describe, it, expect } from 'vitest';
import { rewriteCnImport, findUnresolvedAliasImports, CN_UTIL_SOURCE } from './shadcn';

describe('findUnresolvedAliasImports', () => {
  it('flags @/ and ~/ local imports the sandbox cannot resolve', () => {
    const code = `
      import { AnimatedCircularProgressBar } from "@/registry/magicui/animated-circular-progress-bar";
      import { Button } from "~/components/ui/button";
      import { motion } from "framer-motion";
      import Local from "./thing";
    `;
    expect(findUnresolvedAliasImports(code).sort()).toEqual([
      '@/registry/magicui/animated-circular-progress-bar',
      '~/components/ui/button',
    ]);
  });

  it('returns nothing for code with no alias imports', () => {
    expect(findUnresolvedAliasImports(`import { motion } from 'framer-motion';`)).toEqual([]);
  });

  it('is empty once a cn import has been rewritten', () => {
    const { code } = rewriteCnImport(`import { cn } from "@/lib/utils";`);
    expect(findUnresolvedAliasImports(code)).toEqual([]);
  });
});

describe('rewriteCnImport', () => {
  it('rewrites a cn import from an @/ alias to the local shim', () => {
    const { code, rewritten } = rewriteCnImport(
      `import { cn } from "@/lib/utils";\nexport const x = cn('a', 'b');`,
    );
    expect(rewritten).toBe(true);
    expect(code).toContain(`from './lib/cn'`);
    expect(code).not.toContain('@/lib/utils');
  });

  it('handles multi-line and multi-name imports that include cn', () => {
    const { code, rewritten } = rewriteCnImport(
      `import {\n  cn,\n  buttonVariants,\n} from "@/lib/utils";`,
    );
    expect(rewritten).toBe(true);
    expect(code).toContain(`from './lib/cn'`);
  });

  it('leaves unrelated alias imports and real packages alone', () => {
    const src = `import { Button } from "@/components/ui/button";\nimport { motion } from "framer-motion";`;
    const { code, rewritten } = rewriteCnImport(src);
    expect(rewritten).toBe(false);
    expect(code).toBe(src);
  });

  it('does not false-match identifiers that merely contain "cn"', () => {
    const { rewritten } = rewriteCnImport(`import { cnBase } from "@/lib/utils";`);
    expect(rewritten).toBe(false);
  });

  it('ships a cn helper that composes clsx + tailwind-merge', () => {
    expect(CN_UTIL_SOURCE).toContain('clsx');
    expect(CN_UTIL_SOURCE).toContain('tailwind-merge');
    expect(CN_UTIL_SOURCE).toContain('export function cn');
  });
});
