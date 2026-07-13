"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Global loading indicator for page transitions
// Shows a thin progress bar at the top of the page

export function GlobalLoading() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Listen for route changes via Next.js router events
    const handleStart = () => {
      setLoading(true);
      setProgress(0);
    };

    const handleComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
    };

    // Use MutationObserver to detect loading state changes
    const observer = new MutationObserver(() => {
      const loadingElement = document.querySelector("[data-loading]");
      if (loadingElement) {
        handleStart();
      } else {
        handleComplete();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  // Simulate progress during loading
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [loading]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1">
      <div
        className={cn(
          "h-full bg-primary transition-all duration-300 ease-out",
          loading ? "opacity-100" : "opacity-0"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
