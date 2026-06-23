import { describe, it, expect } from 'vitest';
import { rewriteCnImport, CN_UTIL_SOURCE } from './shadcn';

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
