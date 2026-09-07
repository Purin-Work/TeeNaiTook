'use client';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartNoAxesCombined, Info } from 'lucide-react';
import { api } from '@/lib/api';
import type { PriceHistory } from '@/lib/types';
import { money } from '@/lib/utils';
import { ErrorMessage } from './states';
const colors: Record<string, string> = {
  lowest: '#56d9e9',
  advice: '#56d9e9',
  jib: '#a698ef',
  ihavecpu: '#e6b267',
};
const labels: Record<string, string> = {
  lowest: 'ราคาต่ำสุด',
  advice: 'Advice',
  jib: 'JIB',
  ihavecpu: 'iHAVECPU',
};
function chartDate(value: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(`${value}T00:00:00+07:00`));
}
export function PriceChart({ slug, initial }: { slug: string; initial: PriceHistory }) {
  const [range, setRange] = useState('30d');
  const [mode, setMode] = useState('lowest');
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (range === initial.range && mode === initial.mode && retry === 0) {
      setData(initial);
      setLoading(false);
      setError('');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api<PriceHistory>(`/products/${slug}/price-history?range=${range}&mode=${mode}`, {
      signal: controller.signal,
    })
      .then(setData)
      .catch((err: Error) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [range, mode, slug, initial, retry]);
  const grouped = new Map<string, { day: string; [key: string]: string | number }>();
  data.points.forEach((point) => {
    const day = grouped.get(point.day) || { day: point.day };
    day[point.retailer] = Number(point.price);
    grouped.set(point.day, day);
  });
  // Insert explicit missing buckets, so the chart never draws through an unobserved day.
  const observed = Array.from(grouped.values());
  const chartData: typeof observed = [];
  if (observed.length) {
    const first = new Date(`${observed[0].day}T00:00:00Z`).getTime();
    const last = new Date(`${observed.at(-1)!.day}T00:00:00Z`).getTime();
    const step = Math.max(1, data.bucketDays || 1) * 86400000;
    for (let time = first; time <= last; time += step) {
      const day = new Date(time).toISOString().slice(0, 10);
      chartData.push(grouped.get(day) || { day });
    }
  }
  const axes = (
    <>
      <CartesianGrid stroke="#26313e" strokeDasharray="3 5" vertical={false} />
      <XAxis
        dataKey="day"
        tickFormatter={chartDate}
        stroke="#82909f"
        tickLine={false}
        axisLine={false}
        minTickGap={35}
        fontSize={11}
        dy={8}
      />
      <YAxis
        tickFormatter={(value: number) => `${(value / 1000).toFixed(1)}k`}
        stroke="#82909f"
        tickLine={false}
        axisLine={false}
        domain={['auto', 'auto']}
        width={44}
        fontSize={11}
      />
      <Tooltip
        contentStyle={{
          background: '#19232f',
          border: '1px solid #354454',
          borderRadius: 10,
          color: '#f3f6f9',
          fontSize: 12,
        }}
        labelFormatter={(label) => chartDate(String(label))}
        formatter={(value, name) => [money(Number(value)), labels[String(name)] || String(name)]}
      />
    </>
  );
  return (
    <section className="history-section panel" aria-busy={loading}>
      <div className="chart-heading">
        <div>
          <span className="eyebrow">
            <ChartNoAxesCombined size={14} /> PRICE HISTORY
          </span>
          <h2>ซื้อให้ถูกจังหวะ ดูประวัติราคา</h2>
        </div>
        <div className="range-switch" aria-label="ช่วงเวลาประวัติราคา">
          {[
            ['7d', '7 วัน'],
            ['30d', '30 วัน'],
            ['90d', '90 วัน'],
            ['all', 'ทั้งหมด'],
          ].map(([value, label]) => (
            <button
              type="button"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-subheading">
        <div className="chart-mode">
          <button onClick={() => setMode('lowest')} aria-pressed={mode === 'lowest'}>
            ราคาต่ำสุด
          </button>
          <button onClick={() => setMode('retailers')} aria-pressed={mode === 'retailers'}>
            แยกร้าน
          </button>
        </div>
        <span className="muted text-xs">บาท (THB) · เวลาไทย</span>
      </div>
      {error ? (
        <>
          <ErrorMessage message={error} />
          <button className="text-link my-4" onClick={() => setRetry((value) => value + 1)}>
            ลองโหลดกราฟอีกครั้ง
          </button>
        </>
      ) : loading ? (
        <div className="skeleton chart-container" role="status">
          กำลังโหลดประวัติราคา…
        </div>
      ) : chartData.length ? (
        <div
          className="chart-container"
          data-testid="price-chart"
          role="img"
          aria-label={`กราฟประวัติราคา ${range}: ต่ำสุด ${money(data.summary.low)} เฉลี่ย ${money(data.summary.average)} สูงสุด ${money(data.summary.high)}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            {mode === 'lowest' ? (
              <AreaChart
                data={chartData}
                margin={{ top: 15, right: 10, bottom: 10, left: 0 }}
                accessibilityLayer
              >
                {axes}
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#56d9e9" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#56d9e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="stepAfter"
                  dataKey="lowest"
                  stroke="#56d9e9"
                  strokeWidth={2.5}
                  fill="url(#priceFill)"
                  isAnimationActive={false}
                  connectNulls={false}
                />
              </AreaChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 10, bottom: 10, left: 0 }}
                accessibilityLayer
              >
                {axes}
                {['advice', 'jib', 'ihavecpu'].map((key) => (
                  <Line
                    key={key}
                    type="stepAfter"
                    dataKey={key}
                    stroke={colors[key]}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-chart">
          <ChartNoAxesCombined />
          <p>ยังไม่มีข้อมูลราคาในช่วงนี้</p>
        </div>
      )}
      {mode === 'retailers' && (
        <div className="chart-legend">
          {Object.entries(labels)
            .filter(([key]) => key !== 'lowest')
            .map(([key, label]) => (
              <span key={key}>
                <i style={{ background: colors[key] }} />
                {label}
              </span>
            ))}
        </div>
      )}
      <div className="history-stats" aria-live="polite">
        {[
          ['ต่ำสุดในช่วงนี้', data.summary.low],
          ['ราคาเฉลี่ย', data.summary.average],
          ['สูงสุดในช่วงนี้', data.summary.high],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{loading || error ? '—' : money(value)}</strong>
          </div>
        ))}
      </div>
      <p className="chart-note">
        <Info size={14} />
        <span>
          คำนวณจากราคาต่ำสุดรายวันของสินค้าพร้อมขาย · {data.summary.days} วันที่มีข้อมูล
          {data.isDemo ? ' · ประวัติทั้งหมดเป็นข้อมูลตัวอย่าง' : ''}
        </span>
      </p>
      <div className="tracked-low">
        <span>ต่ำสุดตั้งแต่ TeeNaiTook เริ่มเก็บข้อมูล</span>
        <strong>{money(data.trackedLow)}</strong>
      </div>
    </section>
  );
}
