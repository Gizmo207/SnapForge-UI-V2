import { ImageResponse } from 'next/og';

// Shared artwork for the social share image, used by both the Open Graph and
// Twitter image routes. Kept here so each route file can declare its own
// statically-analyzable metadata exports.

export const OG_ALT = 'SnapForge UI — your component vault, one call away';
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

export function renderOgImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#08080f',
          backgroundImage:
            'radial-gradient(1000px 600px at 80% -10%, #2a1150 0%, transparent 60%), radial-gradient(900px 500px at 0% 110%, #3a0d2e 0%, transparent 55%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c4b5fd',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundImage: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
            }}
          >
            ⚡
          </div>
          SnapForge UI
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: 980,
            backgroundImage: 'linear-gradient(90deg, #ffffff, #e9d5ff, #fbcfe8)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Your component vault, one call away.
        </div>

        <div style={{ marginTop: 32, fontSize: 34, color: 'rgba(255,255,255,0.72)', maxWidth: 940 }}>
          Save any React or HTML component. Preview it live. Hand it to your AI agent over MCP.
        </div>

        <div
          style={{
            marginTop: 'auto',
            fontSize: 26,
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'monospace',
          }}
        >
          React &amp; HTML · live sandbox previews · MCP-native · snapforgeui.com
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
