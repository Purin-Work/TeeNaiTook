import Link from 'next/link';
import { CpuMark } from './cpu-mark';
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="ที่ไหนถูก TeeNaiTook หน้าหลัก">
      <span className="brand-icon">
        <CpuMark size={25} />
      </span>
      <span className="brand-copy">
        <span className="brand-thai">ที่ไหนถูก</span>
        <span className="brand-english">
          TeeNai<span className="text-cyan-300">Took.com</span>
        </span>
      </span>
    </Link>
  );
}
