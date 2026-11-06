import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * Apple touch icon: the favicon (app/icon.svg) rendered at 180 px at build time. Full-bleed green
 * square because iOS applies its own rounded mask.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#315C45',
      }}
    >
      <svg width="150" height="150" viewBox="0 0 64 64">
        <rect x="27" y="9" width="11" height="47" rx="5.5" fill="#F8F6F0" />
        <path
          d="M18 25c9 0 13-5 14-14-9 0-14 5-14 14Zm20 16c10-1 15-7 16-17-11 0-16 6-16 17ZM13 46c10 0 15-5 18-15-11 0-17 5-18 15Z"
          fill="#A8BEA0"
        />
        <path d="M26 27h13M25 42h14" stroke="#315C45" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>,
    size,
  );
}
