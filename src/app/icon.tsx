import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
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
          background: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)',
          borderRadius: 112,
          color: 'white',
          fontSize: 300,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        L
      </div>
    ),
    size
  );
}
