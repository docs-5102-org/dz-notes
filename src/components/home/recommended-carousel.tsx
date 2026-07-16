'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CarouselApi } from '@/components/ui/carousel';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

type RecommendedArticle = {
  title: string;
  description: string;
  href: string;
  channelTitle: string;
  image: string;
};

type Props = {
  articles: RecommendedArticle[];
  siteDescription: string;
  carouselHeight?: number; // 新增
};

export function RecommendedCarousel({ articles, siteDescription, carouselHeight=500 }: Props) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [snapCount, setSnapCount] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!api) return;

    const updateState = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
    };

    updateState();
    api.on('select', updateState);
    api.on('reInit', updateState);

    return () => {
      api.off('select', updateState);
      api.off('reInit', updateState);
    };
  }, [api]);

  React.useEffect(() => {
    if (!api || isPaused || snapCount <= 1) return;

    const timer = window.setInterval(() => {
      api.scrollNext();
    }, 4500);

    return () => window.clearInterval(timer);
  }, [api, isPaused, snapCount]);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleWheel = (event: WheelEvent) => {
      if (!api || Math.abs(event.deltaY) < 10) return;

      event.preventDefault();
      event.stopPropagation();
      setIsPaused(true);

      if (event.deltaY > 0) api.scrollNext();
      else api.scrollPrev();
    };

    node.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      node.removeEventListener('wheel', handleWheel);
    };
  }, [api]);

  if (articles.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative rounded-[2rem] border border-fd-border bg-fd-card/92 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.10)] backdrop-blur md:p-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onWheel={(event) => {
        if (!api || Math.abs(event.deltaY) < 10) return;

        event.preventDefault();
        event.stopPropagation();
        setIsPaused(true);

        if (event.deltaY > 0) api.scrollNext();
        else api.scrollPrev();
      }}
    >
      <Carousel
        orientation="vertical"
        setApi={setApi}
        opts={{ align: 'start', loop: true }}
        className="relative"
      >
        <CarouselContent style={{ height: carouselHeight }}>
          {articles.map((article, index) => (
            <CarouselItem key={article.href} style={{ height: carouselHeight }}>
              <Link
                href={article.href}
                className="group block h-full overflow-hidden rounded-[1.75rem] border border-fd-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-fd-popover)_92%,white_8%)_0%,color-mix(in_srgb,var(--color-fd-card)_96%,var(--color-fd-muted)_4%)_100%)]"
              >
                {/* 
                aspect-[宽/高]，高的数字越大图片越高，比如：
                aspect-[21/12] → 当前
                aspect-[21/10] → 矮一点
                aspect-[21/14] → 高一点 
                */}
                <div className="relative aspect-[16/9] md:aspect-[21/10]">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${article.image})` }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.14)_40%,rgba(0,0,0,0.56)_100%)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.20)_40%,rgba(0,0,0,0.68)_100%)]" />
                  {index === 0 ? (
                    <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300 backdrop-blur">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      Editor&apos;s Pick
                    </div>
                  ) : null}
                </div>

                <div className="px-6 pb-7 pt-6 text-center text-fd-card-foreground">
                  <p className="text-sm font-semibold tracking-[0.18em] text-amber-300">
                    {article.channelTitle}
                  </p>
                  <h3 className="mt-4 text-xl font-semibold leading-tight md:text-2xl">
                    {article.title}
                  </h3>
                  <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-fd-popover-foreground">
                    {index === 0 ? siteDescription : article.description}
                  </p>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {/* 上下箭头切换轮播图 */}
      {/* <div className="absolute right-6 top-6 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setIsPaused(true);
            api?.scrollPrev();
          }}
          aria-label="上一张推荐文章"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/45"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setIsPaused(true);
            api?.scrollNext();
          }}
          aria-label="下一张推荐文章"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/45"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div> */}

      <div className="absolute right-8 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3">
        {Array.from({ length: snapCount }).map((_, index) => {
          const isActive = index === selectedIndex;

          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                setIsPaused(true);
                api?.scrollTo(index);
              }}
              aria-label={`转到第 ${index + 1} 张推荐文章`}
              className={[
                'rounded-full transition-all duration-300',
                isActive
                  ? 'h-10 w-3 bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.16)]'
                  : 'h-3 w-3 bg-white/35 hover:bg-white/55',
              ].join(' ')}
            />
          );
        })}
      </div>
    </div>
  );
}
