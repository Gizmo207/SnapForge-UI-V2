import { ImageResponse } from 'next/og';

// Generated favicon / tab icon — the SnapForge gradient mark.
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          backgroundColor: '#8b5cf6',
          backgroundImage: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          color: 'white',
          fontSize: 22,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        ⚡
      </div>
    ),
    { ...size },
  );
}
