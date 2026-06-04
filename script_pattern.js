const fs = require('fs');

let code = fs.readFileSync('apps/web/components/warga/FeatureCard.tsx', 'utf8');

// Add patternId to props
code = code.replace(/delay\?: number;\n\}/, 'delay?: number;\n  patternId?: 1 | 2 | 3;\n}');

// Add patternId to destructuring
code = code.replace(/delay = 0,/, 'delay = 0,\n  patternId = 1,');

const patterns = `
  const renderPattern = (id: 1 | 2 | 3) => {
    switch (id) {
      case 1:
        return (
          <>
            <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-neutral-100/60 transition-transform duration-500 group-hover:scale-110" />
            <div className="pointer-events-none absolute right-10 top-8 h-16 w-16 rounded-full bg-neutral-200/40 transition-transform duration-500 group-hover:scale-105" />
            <div className="pointer-events-none absolute -bottom-4 right-12 h-24 w-24 rounded-full bg-neutral-100/50 transition-transform duration-500 group-hover:scale-110" />
          </>
        );
      case 2:
        return (
          <>
            <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-neutral-100/50 transition-transform duration-500 group-hover:scale-110" />
            <div className="pointer-events-none absolute right-4 -bottom-6 h-32 w-32 rounded-full bg-neutral-200/40 transition-transform duration-500 group-hover:scale-105" />
            <div className="pointer-events-none absolute right-1/2 top-10 h-14 w-14 rounded-full bg-neutral-100/60 transition-transform duration-500 group-hover:scale-110" />
          </>
        );
      case 3:
        return (
          <>
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-neutral-200/30 transition-transform duration-500 group-hover:scale-110" />
            <div className="pointer-events-none absolute right-8 top-4 h-20 w-20 rounded-full bg-neutral-100/60 transition-transform duration-500 group-hover:scale-105" />
            <div className="pointer-events-none absolute left-1/3 -top-6 h-16 w-16 rounded-full bg-neutral-100/40 transition-transform duration-500 group-hover:scale-110" />
          </>
        );
    }
  };
`;

// Inject the function inside the component
code = code.replace(/const isLarge = variant === 'large';/, \`const isLarge = variant === 'large';\n\${patterns}\`);

// Replace the existing hardcoded pattern with a call to renderPattern
const existingPattern = \`<div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-neutral-100/60 transition-transform duration-500 group-hover:scale-110" />
      <div className="pointer-events-none absolute right-10 top-8 h-16 w-16 rounded-full bg-neutral-200/40 transition-transform duration-500 group-hover:scale-105" />
      <div className="pointer-events-none absolute -bottom-4 right-12 h-24 w-24 rounded-full bg-neutral-100/50 transition-transform duration-500 group-hover:scale-110" />\`;

code = code.replace(existingPattern, '{renderPattern(patternId)}');

fs.writeFileSync('apps/web/components/warga/FeatureCard.tsx', code, 'utf8');

// Now modify page.tsx
let pageCode = fs.readFileSync('apps/web/app/(app)/warga/(main)/page.tsx', 'utf8');
pageCode = pageCode.replace(/delay=\{50\}/, 'delay={50}\\n              patternId={1}');
pageCode = pageCode.replace(/delay=\{100\}/, 'delay={100}\\n                patternId={2}');
pageCode = pageCode.replace(/delay=\{150\}/, 'delay={150}\\n                patternId={3}');
fs.writeFileSync('apps/web/app/(app)/warga/(main)/page.tsx', pageCode, 'utf8');
