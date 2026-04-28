"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/tracking";

interface Props {
  slug: string;
  title: string;
  keywords: string[];
}

export function BlogTracker({ slug, title, keywords }: Props) {
  const startTime = useRef(Date.now());
  const milestones = useRef(new Set<number>());
  const viewTracked = useRef(false);

  useEffect(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      trackEvent("blog_view", { slug, title, tags: keywords });
    }
  }, [slug, title, keywords]);

  // Scroll depth tracking
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const pct = Math.round((scrollTop / docHeight) * 100);

      for (const milestone of [25, 50, 75, 100]) {
        if (pct >= milestone && !milestones.current.has(milestone)) {
          milestones.current.add(milestone);
          trackEvent("blog_scroll_depth", { slug, depth: milestone });
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  // Time on page tracking
  useEffect(() => {
    const sendTime = () => {
      const seconds = Math.round((Date.now() - startTime.current) / 1000);
      if (seconds > 3) {
        trackEvent("blog_time_on_page", { slug, seconds });
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) sendTime();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", sendTime);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", sendTime);
      sendTime();
    };
  }, [slug]);

  return null;
}
