'use client';

import Link from 'next/link';
import { SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';

type FilterValues = {
  q: string;
  category: string;
  brand: string;
  inStock: boolean;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

const pricePresets = [
  { label: 'ไม่เกิน ฿5,000', min: '', max: '5000' },
  { label: '฿5,000–10,000', min: '5000', max: '10000' },
  { label: '฿10,000–20,000', min: '10000', max: '20000' },
  { label: '฿20,000 ขึ้นไป', min: '20000', max: '' },
];

export function ProductFilters({
  route,
  brands,
  values,
}: {
  route: string;
  brands: string[];
  values: FilterValues;
}) {
  const [minPrice, setMinPrice] = useState(values.minPrice);
  const [maxPrice, setMaxPrice] = useState(values.maxPrice);
  const [submitPrices, setSubmitPrices] = useState(false);
  const [priceError, setPriceError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const brandRef = useRef<HTMLSelectElement>(null);
  const apply = () => formRef.current?.requestSubmit();
  useEffect(() => {
    if (!submitPrices) return;
    setSubmitPrices(false);
    formRef.current?.requestSubmit();
  }, [maxPrice, minPrice, submitPrices]);
  return (
    <form
      action={route}
      ref={formRef}
      onSubmit={(event) => {
        if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
          event.preventDefault();
          setPriceError('ราคาต่ำสุดต้องไม่เกินราคาสูงสุด');
        } else {
          setPriceError('');
        }
      }}
    >
      <div className="filter-heading">
        <span>
          <SlidersHorizontal size={16} />
          ตัวกรอง
        </span>
        <Link href={route} aria-label="ล้างตัวกรองทั้งหมด">
          <X size={15} /> ล้างทั้งหมด
        </Link>
      </div>
      {values.q && <input type="hidden" name="q" value={values.q} />}
      <label className="field">
        หมวดหมู่
        <select
          name="category"
          defaultValue={values.category}
          onChange={() => {
            if (brandRef.current) brandRef.current.value = '';
            apply();
          }}
        >
          <option value="">ทุกหมวดหมู่</option>
          {['CPU', 'GPU', 'RAM', 'SSD'].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        แบรนด์
        <select ref={brandRef} name="brand" defaultValue={values.brand} onChange={apply}>
          <option value="">ทุกแบรนด์</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="price-filter">
        <legend>ช่วงราคา (บาท)</legend>
        <div className="price-inputs">
          <input
            aria-label="ราคาต่ำสุด"
            name="minPrice"
            type="number"
            inputMode="numeric"
            min="0"
            max="9999999999"
            step="100"
            placeholder="ต่ำสุด"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
          <span>–</span>
          <input
            aria-label="ราคาสูงสุด"
            name="maxPrice"
            type="number"
            inputMode="numeric"
            min="0"
            max="9999999999"
            step="100"
            placeholder="สูงสุด"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>
        <div className="price-presets" aria-label="เลือกช่วงราคาด่วน">
          {pricePresets.map((preset) => {
            const selected = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                type="button"
                className={selected ? 'selected' : ''}
                aria-pressed={selected}
                key={preset.label}
                onClick={() => {
                  setMinPrice(preset.min);
                  setMaxPrice(preset.max);
                  setSubmitPrices(true);
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        {priceError && <span className="field-error">{priceError}</span>}
      </fieldset>
      <label className="checkbox-field">
        <input
          type="checkbox"
          name="inStock"
          value="true"
          defaultChecked={values.inStock}
          onChange={apply}
        />
        เฉพาะสินค้าที่มีพร้อมขาย
      </label>
      <label className="field">
        เรียงตาม
        <select name="sort" defaultValue={values.sort} onChange={apply}>
          <option value="price_asc">ราคาถูกสุด</option>
          <option value="price_drop">ราคาลดมากที่สุด</option>
          <option value="popular">ยอดนิยม</option>
          <option value="updated">อัปเดตล่าสุด</option>
          <option value="name">ชื่อสินค้า</option>
        </select>
      </label>
      <Button type="submit" className="w-full">
        แสดงผลตามตัวกรอง
      </Button>
    </form>
  );
}
