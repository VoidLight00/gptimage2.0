"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import Fuse from "fuse.js";
import { SourceBadge } from "@/components/SourceBadge";
import { SourceToggle } from "@/components/SourceToggle";
import { useDebounce } from "@/hooks/useDebounce";
import { normalizeSourceFilter } from "@/lib/archive-filters";
import {
  filterSearchItems,
  getSearchCategoryOptions,
  getSearchDomainOptions,
  getSearchFormatOptions,
  getSourceCounts,
  normalizeSearchSort,
  sortSearchItems,
  type SearchFilterOption,
  type SearchItem,
  type SearchSort,
} from "@/lib/archive-search";

function getCopy(lang: "ko" | "en") {
  return lang === "ko"
    ? {
        placeholder: "프롬프트, 제목, 태그, 카테고리를 검색하세요",
        total: "전체",
        matches: "검색 결과",
        noResults: "조건에 맞는 항목이 없습니다.",
        emptyPrompt: "검색어를 입력하거나 필터를 조정해 보세요.",
        category: "카테고리",
        domain: "도메인",
        format: "포맷",
        sort: "정렬",
        latest: "최신순",
        title: "제목순",
        clear: "필터 초기화",
      }
    : {
        placeholder: "Search prompts, titles, tags, categories",
        total: "Total",
        matches: "Matches",
        noResults: "No entries match this search.",
        emptyPrompt: "Try another query or adjust the filters.",
        category: "Category",
        domain: "Domain",
        format: "Format",
        sort: "Sort",
        latest: "Latest",
        title: "Title",
        clear: "Clear filters",
      };
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  allLabel,
}: {
  label: string;
  value: string | null;
  options: SearchFilterOption[];
  onChange: (value: string | null) => void;
  allLabel: string;
}) {
  if (options.length === 0) {
    return null;
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-50">{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="min-h-[44px] border border-border-strong bg-bg px-4 py-3 font-mono text-[12px] uppercase tracking-[0.12em] text-fg focus:outline-none focus:border-fg"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
    </label>
  );
}

type SearchClientState = {
  query: string;
  source: ReturnType<typeof normalizeSourceFilter>;
  category: string | null;
  domain: string | null;
  format: string | null;
  sort: SearchSort;
};

function readSearchClientState(searchParams: ReadonlyURLSearchParams): SearchClientState {
  return {
    query: searchParams.get("q") ?? "",
    source: normalizeSourceFilter(searchParams.get("source")),
    category: searchParams.get("category"),
    domain: searchParams.get("domain"),
    format: searchParams.get("format"),
    sort: normalizeSearchSort(searchParams.get("sort")),
  };
}

function SearchClientBody({
  items,
  lang,
  initialState,
}: {
  items: SearchItem[];
  lang: "ko" | "en";
  initialState: SearchClientState;
}) {
  const copy = getCopy(lang);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialState.query);
  const [source, setSource] = useState(initialState.source);
  const [category, setCategory] = useState(initialState.category);
  const [domain, setDomain] = useState(initialState.domain);
  const [format, setFormat] = useState(initialState.format);
  const [sort, setSort] = useState<SearchSort>(initialState.sort);

  const debouncedQuery = useDebounce(query, 180);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "title", weight: 0.35 },
          { name: "prompt", weight: 0.35 },
          { name: "tags", weight: 0.12 },
          { name: "categoryLabel", weight: 0.1 },
          { name: "model", weight: 0.08 },
        ],
        threshold: 0.32,
        ignoreLocation: true,
      }),
    [items]
  );

  const searchedItems = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }

    return fuse.search(debouncedQuery.trim()).map((result) => result.item);
  }, [debouncedQuery, fuse, items]);

  const categoryOptions = useMemo(() => getSearchCategoryOptions(searchedItems), [searchedItems]);
  const domainOptions = useMemo(() => getSearchDomainOptions(searchedItems), [searchedItems]);
  const formatOptions = useMemo(() => getSearchFormatOptions(searchedItems), [searchedItems]);

  const filteredItems = useMemo(
    () =>
      filterSearchItems(searchedItems, {
        source,
        category,
        domain,
        format,
      }),
    [searchedItems, source, category, domain, format]
  );

  const sortedItems = useMemo(() => sortSearchItems(filteredItems, sort), [filteredItems, sort]);
  const visibleItems = sortedItems.slice(0, 48);
  const counts = useMemo(() => getSourceCounts(searchedItems), [searchedItems]);
  const activeFilters = [source !== "all", Boolean(category), Boolean(domain), Boolean(format)].filter(Boolean).length;

  const searchParamsString = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    const normalizedQuery = debouncedQuery.trim();

    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    } else {
      params.delete("q");
    }

    if (source === "all") {
      params.delete("source");
    } else {
      params.set("source", source);
    }

    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    if (domain) {
      params.set("domain", domain);
    } else {
      params.delete("domain");
    }

    if (format) {
      params.set("format", format);
    } else {
      params.delete("format");
    }

    if (sort === "latest") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }

    const next = params.toString();
    if (next !== searchParamsString) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [category, debouncedQuery, domain, format, pathname, router, searchParamsString, sort, source]);

  const clearFilters = () => {
    setSource("all");
    setCategory(null);
    setDomain(null);
    setFormat(null);
    setSort("latest");
  };

  return (
    <div>
      <div className="space-y-5 border-b border-border-subtle pb-8 md:pb-10">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.placeholder}
          className="w-full bg-transparent border-b border-border-strong px-0 py-4 md:py-5 font-sans text-xl md:text-3xl text-fg placeholder:text-fg-30 focus:outline-none focus:border-fg"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="search"
        />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-50">
            {debouncedQuery.trim()
              ? `${sortedItems.length} ${copy.matches}`
              : `${items.length} ${copy.total}`}
          </div>
          <SourceToggle value={source} counts={counts} onChange={setSource} lang={lang} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
          <FilterSelect
            label={copy.category}
            value={category}
            options={categoryOptions}
            onChange={setCategory}
            allLabel={copy.total}
          />
          <FilterSelect
            label={copy.domain}
            value={domain}
            options={domainOptions}
            onChange={setDomain}
            allLabel={copy.total}
          />
          <FilterSelect
            label={copy.format}
            value={format}
            options={formatOptions}
            onChange={setFormat}
            allLabel={copy.total}
          />

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-50">{copy.sort}</span>
            <select
              value={sort}
              onChange={(event) => setSort(normalizeSearchSort(event.target.value))}
              className="min-h-[44px] border border-border-strong bg-bg px-4 py-3 font-mono text-[12px] uppercase tracking-[0.12em] text-fg focus:outline-none focus:border-fg"
            >
              <option value="latest">{copy.latest}</option>
              <option value="title">{copy.title}</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full min-h-[44px] border border-border-strong px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-70 hover:bg-surface-hover"
            >
              {copy.clear}
              {activeFilters > 0 ? ` (${activeFilters})` : ""}
            </button>
          </div>
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {visibleItems.map((item) => {
            const title = item.title ?? item.prompt;
            return (
              <Link
                key={item.id}
                href={`/${lang}/p/${item.id}`}
                className="group block border border-border-subtle hover:border-border-strong"
              >
                <div className="relative w-full bg-surface" style={{ aspectRatio: `${item.w}/${item.h}` }}>
                  <Image
                    src={item.thumb}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 50vw, 300px"
                    placeholder={item.blur ? "blur" : "empty"}
                    blurDataURL={item.blur || undefined}
                    className="object-cover"
                  />
                </div>
                <div className="p-2.5 md:p-3">
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.12em] text-fg-50">
                    <div className="truncate">{item.categoryLabel}</div>
                    <SourceBadge source={item.source} license={item.license} />
                  </div>
                  <div className="mt-2 line-clamp-2 font-sans text-[12px] md:text-[13px] leading-[1.5] text-fg">
                    {title}
                  </div>
                  <div className="mt-1 line-clamp-2 font-sans text-[11px] md:text-[12px] leading-[1.5] text-fg-60">
                    {item.prompt}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 md:mt-12 border border-border-subtle bg-surface p-10 md:p-12">
          <div className="font-mono text-[13px] uppercase tracking-[0.14em] text-fg-50">{copy.noResults}</div>
          <p className="mt-3 font-sans text-sm text-fg-60">{copy.emptyPrompt}</p>
        </div>
      )}
    </div>
  );
}

export function SearchClient({ items, lang }: { items: SearchItem[]; lang: "ko" | "en" }) {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => readSearchClientState(searchParams), [searchParams]);

  return <SearchClientBody items={items} lang={lang} initialState={initialState} key={searchParams.toString()} />;
}
