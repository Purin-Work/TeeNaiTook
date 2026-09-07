'use client';
import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowUpRight, LoaderCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { money } from '@/lib/utils';
import type { PageResult, Product } from '@/lib/types';
export function SearchBox({
  initialQuery = '',
  hero = false,
}: {
  initialQuery?: string;
  hero?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const id = useId();
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      api<PageResult<Product>>(`/products?q=${encodeURIComponent(query)}&limit=5`, {
        signal: controller.signal,
      })
        .then((result) => {
          setSuggestions(result.data);
          setActive(-1);
        })
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <div
      className={`search-box ${hero ? 'search-hero' : ''}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <form
        action="/search"
        className="search-form"
        onSubmit={(event) => {
          if (active >= 0 && suggestions[active] && open) {
            event.preventDefault();
            router.push(`/product/${suggestions[active].slug}`);
          }
          setOpen(false);
        }}
      >
        <Search size={21} className="search-icon" />
        <input
          id={`${id}-input`}
          aria-label="ค้นหาสินค้า"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={`${id}-suggestions`}
          aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
          autoComplete="off"
          name="q"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, suggestions.length - 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            }
          }}
          placeholder="ค้นหา CPU, GPU, RAM, SSD เช่น RTX 5070 Ti"
        />
        {loading && <LoaderCircle size={17} className="spin muted" />}
        <button type="submit" className="search-submit" aria-label="ค้นหาราคา">
          <span>ค้นหาราคา</span>
          <ArrowUpRight size={18} />
        </button>
      </form>
      {open && suggestions.length > 0 && (
        <div
          id={`${id}-suggestions`}
          className="search-suggestions"
          role="listbox"
          tabIndex={-1}
          aria-label="สินค้าที่แนะนำ"
        >
          {suggestions.map((p, index) => (
            <button
              type="button"
              role="option"
              aria-label={`${p.name} ${money(p.minimumPrice)}`}
              aria-selected={active === index}
              id={`${id}-${index}`}
              key={p.id}
              className={active === index ? 'selected' : ''}
              onClick={() => {
                setOpen(false);
                router.push(`/product/${p.slug}`);
              }}
            >
              <span>
                <span className="suggestion-category">{p.category}</span>
                {p.name}
              </span>
              <strong>{money(p.minimumPrice)}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
