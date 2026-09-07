import type { Category } from '@/lib/types';
import { Cpu, CircuitBoard, MemoryStick, HardDrive } from 'lucide-react';
export const categoryIcons = { CPU: Cpu, GPU: CircuitBoard, RAM: MemoryStick, SSD: HardDrive };
export function CategoryArt({ category, large = false }: { category: Category; large?: boolean }) {
  return (
    <div
      className={`category-art art-${category.toLowerCase()} ${large ? 'art-large' : ''}`}
      aria-hidden="true"
    >
      <div className="art-grid" />
      <svg viewBox="0 0 240 135" fill="none" className="hardware-svg">
        {category === 'CPU' && (
          <g transform="translate(77 23) rotate(-8 45 45)">
            {Array.from({ length: 8 }, (_, i) => (
              <g key={i} stroke="currentColor" strokeWidth="3">
                <path
                  d={`M ${14 + i * 9} 0 v-7 M ${14 + i * 9} 90 v7 M 0 ${14 + i * 9} h-7 M 90 ${14 + i * 9} h7`}
                />
              </g>
            ))}
            <rect
              width="90"
              height="90"
              rx="9"
              fill="#172738"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="10"
              y="10"
              width="70"
              height="70"
              rx="5"
              fill="#223c4d"
              stroke="currentColor"
              strokeOpacity=".5"
            />
            <rect x="22" y="22" width="46" height="46" rx="4" fill="#182b3a" />
            <text
              x="45"
              y="48"
              textAnchor="middle"
              fill="currentColor"
              fontSize="11"
              fontWeight="700"
            >
              CPU
            </text>
            <path d="M33 56h24" stroke="currentColor" strokeOpacity=".5" />
          </g>
        )}
        {category === 'GPU' && (
          <g transform="translate(29 34) rotate(-7 90 36)">
            <rect
              width="182"
              height="72"
              rx="9"
              fill="#1d283b"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M12 78h155M16 72v10m150-10v10" stroke="currentColor" strokeWidth="3" />
            {[48, 132].map((x) => (
              <g key={x}>
                <circle cx={x} cy="36" r="26" stroke="currentColor" strokeOpacity=".55" />
                <circle cx={x} cy="36" r="20" stroke="currentColor" strokeOpacity=".2" />
                {Array.from({ length: 7 }, (_, i) => (
                  <path
                    key={i}
                    d={`M ${x} 31 Q ${x + 30} 12 ${x + 17} 38 Q ${x + 8} 32 ${x} 41`}
                    transform={`rotate(${i * 51.4} ${x} 36)`}
                    fill="currentColor"
                    fillOpacity=".2"
                  />
                ))}
                <circle cx={x} cy="36" r="7" fill="#283c57" stroke="currentColor" />
              </g>
            ))}
            <path d="M-5 4v64M-7 14h7m-7 14h7m-7 14h7" stroke="currentColor" strokeWidth="2" />
          </g>
        )}
        {category === 'RAM' && (
          <g transform="translate(30 43) rotate(-9 90 26)">
            <rect
              width="180"
              height="47"
              rx="5"
              fill="#1d3031"
              stroke="currentColor"
              strokeWidth="2"
            />
            {[12, 48, 84, 120, 151].map((x) => (
              <rect
                key={x}
                x={x}
                y="10"
                width="23"
                height="26"
                rx="2"
                fill="#233e3c"
                stroke="currentColor"
                strokeOpacity=".5"
              />
            ))}
            <path d="M8 47h164v8H98v-5h-8v5H8z" fill="currentColor" fillOpacity=".6" />
            {Array.from({ length: 24 }, (_, i) => (
              <path key={i} d={`M ${12 + i * 6.6} 49 v5`} stroke="#0e1c21" />
            ))}
          </g>
        )}
        {category === 'SSD' && (
          <g transform="translate(35 44) rotate(-10 85 25)">
            <rect
              width="170"
              height="48"
              rx="5"
              fill="#262839"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="8" cy="24" r="4" stroke="currentColor" />
            <rect x="20" y="6" width="114" height="36" rx="2" fill="#343149" />
            <path
              d="M30 17h75M30 24h62M30 31h38"
              stroke="currentColor"
              strokeOpacity=".7"
              strokeWidth="2"
            />
            <text x="122" y="32" textAnchor="end" fill="currentColor" fontSize="8">
              NVMe
            </text>
            <path d="M154 9h20v29h-20z" fill="currentColor" fillOpacity=".5" />
            <path d="M157 9v29m5-29v29m5-29v29" stroke="#262839" strokeWidth="2" />
          </g>
        )}
      </svg>
      <span className="art-caption">
        {category === 'CPU'
          ? 'PROCESSING POWER'
          : category === 'GPU'
            ? 'NEXT LEVEL GRAPHICS'
            : category === 'RAM'
              ? 'MORE ROOM TO PLAY'
              : 'SPEED UP EVERYTHING'}
      </span>
    </div>
  );
}
