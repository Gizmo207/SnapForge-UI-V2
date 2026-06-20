import type { Framework } from '../../domains/ingestion/pure/detectFramework';

/**
 * The fixture corpus: real pasted snippets paired with their expected ingestion
 * contract. This is the spine of the test-first discipline (see
 * build_anything_protocol/09_testing_strategy/README.md). Grow it with every new
 * rule or edge case.
 */
export type IngestionFixture = {
  id: string;
  source: string;
  expected: {
    framework: Framework;
    name: string;
    category: string;
    subcategory: string;
    tags: string[]; // asserted as a subset (must-contain), order-independent
    dependencies: string[];
  };
};

export const ingestionCorpus: IngestionFixture[] = [
  {
    id: 'react-primary-button',
    source: `import React from 'react';

export default function PrimaryButton() {
  return <button className="btn btn-primary">Click me</button>;
}`,
    expected: {
      framework: 'react',
      name: 'Primary Button',
      category: 'primitives',
      subcategory: 'buttons',
      tags: ['button'],
      dependencies: [],
    },
  },
  {
    id: 'react-card-with-dep',
    source: `import React from 'react';
import { motion } from 'framer-motion';

export default function ProfileCard() {
  return (
    <motion.div className="card" whileHover={{ scale: 1.02 }}>
      <h3>Profile</h3>
    </motion.div>
  );
}`,
    expected: {
      framework: 'react',
      name: 'Profile Card',
      category: 'components',
      subcategory: 'cards',
      tags: ['card', 'hover'],
      dependencies: ['framer-motion'],
    },
  },
  {
    id: 'html-button',
    source: `<button class="cta">Get started</button>`,
    expected: {
      framework: 'html',
      name: 'Button',
      category: 'primitives',
      subcategory: 'buttons',
      tags: ['button'],
      dependencies: [],
    },
  },
  {
    id: 'html-login-form',
    source: `<form class="login">
  <input type="email" placeholder="Email" />
  <input type="password" placeholder="Password" />
  <button type="submit">Sign in</button>
</form>`,
    expected: {
      framework: 'html',
      name: 'Form',
      category: 'patterns',
      subcategory: 'forms',
      tags: ['form'],
      dependencies: [],
    },
  },
  {
    id: 'react-animated-loader',
    source: `import React from 'react';

export default function Spinner() {
  return <div className="spinner" style={{ animation: 'spin 1s linear infinite' }} />;
}

// @keyframes spin { to { transform: rotate(360deg); } }`,
    expected: {
      // Single-word base names ('Spinner') intentionally fall through to
      // style-prefix + subcategory label per inferName's documented rules.
      framework: 'react',
      name: 'Animated Loader',
      category: 'primitives',
      subcategory: 'loaders',
      tags: ['animation', 'loader'],
      dependencies: [],
    },
  },
  {
    id: 'react-no-import-jsx',
    // Modern React snippet with no `import React` — must still be detected as
    // react so its JSX is routed to the JSX gate, not the HTML gate.
    source: `export default function ProductCard() {
  return <div className="card">Product</div>;
}`,
    expected: {
      framework: 'react',
      name: 'Product Card',
      category: 'components',
      subcategory: 'cards',
      tags: ['card'],
      dependencies: [],
    },
  },
  {
    id: 'html-prose-return',
    // Prose containing the word "return" must NOT be misdetected as react.
    source: `<p>Our return policy is simple and fair.</p>`,
    expected: {
      framework: 'html',
      name: 'Component',
      category: 'components',
      subcategory: 'misc',
      tags: [],
      dependencies: [],
    },
  },
  {
    id: 'garbage-input',
    source: `)(@#*$&)(@#*  not really code  <<>><<`,
    expected: {
      framework: 'html',
      name: 'Component',
      category: 'components',
      subcategory: 'misc',
      tags: [],
      dependencies: [],
    },
  },
];
