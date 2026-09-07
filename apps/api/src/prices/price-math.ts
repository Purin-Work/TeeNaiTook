export function priceStatus(current: number | null, dailyPrices: number[]) {
  if (current === null || dailyPrices.length < 30)
    return { label: 'ข้อมูลราคายังไม่เพียงพอ', percentile: null };
  const rank = (dailyPrices.filter((p) => p < current).length / dailyPrices.length) * 100;
  return {
    label:
      rank <= 10
        ? 'ราคาดีมาก'
        : rank <= 30
          ? 'ราคาดี'
          : rank <= 75
            ? 'ราคาปกติ'
            : 'ราคาค่อนข้างสูง',
    percentile: Math.round(rank),
  };
}
export function priceChange(current: number | null, reference: number | null) {
  return current === null || reference === null || reference <= 0
    ? null
    : Math.round(((current - reference) / reference) * 1000) / 10;
}
