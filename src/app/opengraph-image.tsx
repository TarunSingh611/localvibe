import { ImageResponse } from 'next/og';

export const alt = 'LocalVibe - Your neighborhood, connected';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: 'white',
              color: '#0ea5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
              fontWeight: 800,
            }}
          >
            L
          </div>
          <div style={{ fontSize: 56, fontWeight: 800 }}>LocalVibe</div>
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, marginTop: 48, lineHeight: 1.1 }}>Your neighborhood, connected.</div>
        <div style={{ fontSize: 32, marginTop: 24, opacity: 0.9 }}>Local feed · Marketplace · Events · Emergency alerts</div>
      </div>
    ),
    size
  );
}
