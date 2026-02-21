import React from "react";

interface LogoHimaProps extends Omit<React.SVGProps<SVGSVGElement>, 'color'> {
  lineColor?: string;
  glyphColor?: string;
  textColor?: string;
}

const LogoHima: React.FC<LogoHimaProps> = ({
  lineColor = "currentColor",
  glyphColor = "currentColor",
  textColor = "currentColor",
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
      aria-label="HIMA Musik"
      role="img"
      {...props}
    >
      <g transform="matrix(1,0,0,1,5.390543,-10.955462)">
        {/* Lines */}
        <g>
          <g transform="matrix(1.291412,0,0,1.291412,-182.87743,-147.018893)">
            <path d="M156,461L325,461" fill="none" stroke={lineColor} strokeWidth="2.42" />
          </g>
          <g transform="matrix(1.291412,0,0,1.291412,-182.87743,-119.253537)">
            <path d="M156,461L325,461" fill="none" stroke={lineColor} strokeWidth="2.42" />
          </g>
          <g transform="matrix(1.291412,0,0,1.291412,-182.87743,-91.488182)">
            <path d="M156,461L325,461" fill="none" stroke={lineColor} strokeWidth="2.42" />
          </g>
          <g transform="matrix(1.291412,0,0,1.291412,-182.87743,-63.722826)">
            <path d="M156,461L325,461" fill="none" stroke={lineColor} strokeWidth="2.42" />
          </g>
          <g transform="matrix(1.291412,0,0,1.291412,-182.87743,-35.957471)">
            <path d="M156,461L325,461" fill="none" stroke={lineColor} strokeWidth="2.42" />
          </g>
        </g>

        {/* Glyph */}
        <g>
          <g transform="matrix(1.291412,0,0,7.231907,-176.420371,-2718.736518)">
            <rect x="317" y="434" width="14" height="25" fill={glyphColor} />
          </g>
          <g transform="matrix(3.773419,-3.777321,3.031481,3.02835,-2276.284382,387.878671)">
            <rect x="317" y="434" width="14" height="25" fill={glyphColor} />
          </g>
          <g transform="matrix(6.075937,-6.08222,0.446656,0.446194,-1819.747829,2303.741034)">
            <rect x="317" y="434" width="14" height="25" fill={glyphColor} />
          </g>
          <g transform="matrix(3.682456,-3.492579,2.991335,3.153962,-2344.324062,235.048024)">
            <rect x="317" y="434" width="14" height="25" fill={glyphColor} />
          </g>
          <g transform="matrix(7.859034,-7.453802,0.730417,0.770127,-2630.146603,2585.135639)">
            <rect x="317" y="434" width="14" height="25" fill={glyphColor} />
          </g>
          <g transform="matrix(6.330114,-6.003717,0.45017,0.474644,-2117.893172,2229.161406)">
            <rect x="317" y="434" width="14" height="25" fill={glyphColor} />
          </g>
        </g>

        {/* Text */}
        <g>
          <g transform="matrix(1.113632,0,0,1.113632,-100.999802,-196.00093)">
            <text
              x="472.124"
              y="595.215"
              fill={textColor}
              fontFamily="LucidaGrande, Lucida Grande, sans-serif"
              fontWeight="500"
              fontSize="45.833"
            >
              Hima Musik
            </text>
          </g>
          <g transform="matrix(1.113632,0,0,1.113632,-102.055155,-81.270022)">
            <text
              x="472.124"
              y="595.215"
              fill={textColor}
              fontFamily="LucidaGrande, Lucida Grande, sans-serif"
              fontWeight="500"
              fontSize="45.833"
            >
              Yogyakarta
            </text>
          </g>
          <g transform="matrix(1.113632,0,0,1.113632,-100.999802,-137.339596)">
            <text
              x="472.124"
              y="595.215"
              fill={textColor}
              fontFamily="LucidaGrande, Lucida Grande, sans-serif"
              fontWeight="500"
              fontSize="45.833"
            >
              Institut Seni Indonesia
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
};

export default LogoHima;