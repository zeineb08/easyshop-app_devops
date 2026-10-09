"use client";

import React, { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or searchParams changes, navigation is complete
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isNavigating]);

  // Intercept clicks on links that lead to a different path
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, downloads, new tabs, and hashes
      if (
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      // Check if it's the current page
      try {
        const nextUrl = new URL(href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Only start if same origin and different path/query
        if (
          nextUrl.origin === currentUrl.origin &&
          (nextUrl.pathname !== currentUrl.pathname ||
            nextUrl.search !== currentUrl.search)
        ) {
          setIsNavigating(true);
          setProgress(25);
        }
      } catch {
        // Relative or invalid URL fallback
        if (href.startsWith("/") && href !== window.location.pathname) {
          setIsNavigating(true);
          setProgress(25);
        }
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  // Animate progress smoothly while navigating
  useEffect(() => {
    if (!isNavigating) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const increment = Math.max(1, (90 - prev) * 0.15);
        return Math.min(prev + increment, 90);
      });
    }, 100);

    // Safety timeout in case navigation is aborted
    const timeout = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isNavigating]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
    >
      {/* Top progress bar */}
      <div
        className="h-[3px] bg-primary transition-all duration-200 ease-out shadow-[0_0_8px_hsl(var(--primary))]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? "width 150ms ease-out, opacity 250ms 150ms ease-out" : "width 200ms ease-out",
        }}
      />
    </div>
  );
}

export default function NavigationLoader() {
  return (
    <React.Suspense fallback={null}>
      <NavigationLoaderInner />
    </React.Suspense>
  );
}
