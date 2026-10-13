"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error caught:", error);
  }, [error]);

  return (
    <main className="auth-shell">
      <div className="auth-wrap">
        <Link href="/" className="wordmark">
          <span className="wordmark-mark">c.</span> campus kin
        </Link>
        <div className="auth-panel" style={{ textAlign: "center", padding: "36px 24px" }}>
          <div className="empty-mark" style={{ margin: "0 auto 16px" }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "24px", marginBottom: "8px" }}>
            Reconnecting to Campus Kin
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "20px" }}>
            Your session is active. Let’s reload to sync your campus circle.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button className="button button-primary" onClick={() => reset()}>
              <RefreshCw size={16} /> Reload Page
            </button>
            <Link href="/feed" className="button button-secondary">
              Go to Feed
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
