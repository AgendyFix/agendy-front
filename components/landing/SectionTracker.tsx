"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/tracking";

interface Props {
  sectionId: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionTracker({ sectionId, children, className }: Props) {
  const ref = useRef<HTMLElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true;
          trackEvent("lp_section_view", { section: sectionId });
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionId]);

  return (
    <section ref={ref} id={sectionId} className={className}>
      {children}
    </section>
  );
}
