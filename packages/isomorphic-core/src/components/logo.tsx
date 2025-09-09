import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  iconOnly?: boolean;
  colorMode?: 'light' | 'dark';
}

export default function Logo({ iconOnly = false, colorMode = 'light', ...props }: IconProps) {
  // Define colors for light and dark mode
  const mainColor = colorMode === 'dark' ? '#fff' : '#3c748b';
  const iconColor = colorMode === 'dark' ? '#fff' : '#0c526e';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox={`0 0 ${iconOnly ? '48 26' : '100 28'}`}
      {...props}
    >
      {!iconOnly ? (
        <>
          <text
            x="0"
            y="20"
            fill={mainColor}
            fontFamily="Arial, sans-serif"
            fontSize="21"
            fontWeight="bold"
          >
            PESKAS
          </text>
          <text
            x="86"
            y="12"
            fill={mainColor}
            fontFamily="Arial, sans-serif"
            fontSize="10"
            fontWeight="bold"
          >
            TM
          </text>
        </>
      ) : (
        <>
          <text
            x="0"
            y="20"
            fill={iconColor}
            fontFamily="Arial, sans-serif"
            fontSize="20"
            fontWeight="bold"
          >
            PSK
          </text>
        </>
      )}
    </svg>
  );
}
