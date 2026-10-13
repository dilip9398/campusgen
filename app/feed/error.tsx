"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";

export default function FeedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Feed error caught:", error);
  }, [error]);

  return (
    <main className="app-frame feed-page">
      <div className="empty-state">
        <div className="empty-mark">
          <Sparkles size={24} />
        </div>
        <h2>Refreshing Campus Feed</h2>
        <p>
          We’re syncing your campus profile with Siddhartha circle. Click below to reconnect.
        </p>
        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button className="button button-primary" onClick={() => reset()}>
            <RefreshCw size={16} /> Try Again
          </button>
          <Link href="/profile" className="button button-secondary">
            <ArrowLeft size={16} /> View Profile
          </Link>
        </div>
      </div>
    </main>
  );
}
