"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Flame, Lock, MessageCircle, Share2, Sparkles, Users } from "lucide-react";
import { avatarUrl, formatAvatarUrl } from "@/lib/constants";
import type { DiscoveryProfile, Profile } from "@/lib/types";

export function FeedLocked143({
  count,
  goal = 143,
  profiles = [],
  myProfile,
}: {
  count: number;
  goal?: number;
  profiles?: DiscoveryProfile[];
  myProfile: Profile;
}) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");

  const percent = Math.min(100, Math.max(4, Math.round((count / goal) * 100)));
  const remaining = Math.max(0, goal - count);

  const inviteText = `Hey! Siddhartha Campus Kin unlocks the campus dating feed when 143 students join! We're at ${count}/${goal} students right now. Join with your college email here:`;

  function copyInvite() {
    const url = typeof window !== "undefined" ? window.location.origin + "/auth" : "https://campuskin.in/auth";
    const fullMessage = `${inviteText} ${url}`;
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    setToast("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2800);
    setTimeout(() => setToast(""), 2800);
  }

  function shareWhatsApp() {
    const url = typeof window !== "undefined" ? window.location.origin + "/auth" : "https://campuskin.in/auth";
    const fullMessage = `${inviteText} ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`, "_blank");
  }

  const teasers = profiles.slice(0, 3);

  return (
    <div className="feed-locked-container">
      {/* 143 Curiosity Hero */}
      <div className="feed-unlock-hero">
        <div className="unlock-live-tag">
          <span className="live-dot" />
          <span>LIVE CAMPUS COUNTER • 143 CHALLENGE</span>
        </div>
        <h1 className="unlock-title">
          The Campus Feed Unlocks at <em>143 Students.</em>
        </h1>
        <p className="unlock-subtitle">
          In campus lore, <strong>143</strong> stands for the unspoken code. To ensure a vibrant experience with genuine connections across departments, the full discovery feed unlocks the moment 143 verified Siddhartha peers join!
        </p>

        {/* Live Milestone Progress Card */}
        <div className="unlock-progress-card">
          <div className="unlock-stats-grid">
            <div className="stat-box">
              <span className="stat-num">{count}</span>
              <span className="stat-label">Students Joined</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">{remaining}</span>
              <span className="stat-label">More Needed</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">{percent}%</span>
              <span className="stat-label">Goal Completed</span>
            </div>
          </div>

          <div className="progress-bar-wrapper">
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${percent}%` }}
              >
                <div className="progress-bar-glow" />
              </div>
            </div>
            <div className="progress-milestones">
              <span>0</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span className="goal-flag">🎯 143 UNLOCK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Viral WhatsApp & Friends Share Engine */}
      <div className="unlock-viral-card">
        <div className="viral-content">
          <div className="viral-icon">
            <Flame size={24} />
          </div>
          <div>
            <h3>Want to unlock the feed faster? 🚀</h3>
            <p>
              Share with your campus groups, hostel buddies, and friends. Every Siddhartha student who signs up counts toward the 143 unlock!
            </p>
          </div>
        </div>
        <div className="viral-actions">
          <button type="button" className="whatsapp-share-btn" onClick={shareWhatsApp}>
            <Share2 size={16} /> Share on WhatsApp
          </button>
          <button type="button" className="copy-link-btn" onClick={copyInvite}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Link Copied!" : "Copy Invite Link"}
          </button>
        </div>
      </div>

      {/* Mystery Curiosity Teaser Reel */}
      <div className="teaser-section">
        <div className="teaser-header">
          <span className="eyebrow"><Sparkles size={13} /> CURIOUS WHO’S INSIDE?</span>
          <h2>Teaser Reel • Students In Your Orbit</h2>
          <p>Full profiles, photos, and like/match actions unlock automatically once we hit 143.</p>
        </div>

        <div className="teaser-grid">
          {teasers.length > 0 ? (
            teasers.map((t, idx) => (
              <div key={t.id || idx} className="teaser-card">
                <div className="teaser-photo-box">
                  <img
                    src={formatAvatarUrl(t.avatar_url, t.full_name)}
                    alt="Mystery student"
                    className="teaser-blurred-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = avatarUrl(t.full_name || "Student");
                    }}
                  />
                  <div className="teaser-lock-badge">
                    <Lock size={18} />
                    <span>Unlocks at 143</span>
                  </div>
                </div>
                <div className="teaser-info">
                  <div className="teaser-tag-row">
                    <span className="teaser-dept-tag">{t.major} · {t.grad_year}</span>
                    <span className="teaser-gender-tag">{t.gender === "female" ? "Woman" : "Man"}</span>
                  </div>
                  <h4 className="teaser-name-blurred">••••••••••••</h4>
                  {Array.isArray(t.relationship_vibes) && t.relationship_vibes.length > 0 && (
                    <div className="teaser-vibes">
                      {t.relationship_vibes.slice(0, 2).map((v) => (
                        <span key={v} className="teaser-vibe-pill">{v}</span>
                      ))}
                    </div>
                  )}
                  <p className="teaser-hint">A verified {t.major} student in your orbit.</p>
                </div>
              </div>
            ))
          ) : (
            [
              { dept: "CSE · 2026", gender: "Woman", vibe: "Cafes & campus breaks" },
              { dept: "ECE · 2025", gender: "Man", vibe: "Warm companionship" },
              { dept: "IT · 2026", gender: "Woman", vibe: "Study buddy with canteen chai" },
            ].map((mock, i) => (
              <div key={i} className="teaser-card">
                <div className="teaser-photo-box">
                  <div className="mock-blurred-bg" />
                  <div className="teaser-lock-badge">
                    <Lock size={18} />
                    <span>Unlocks at 143</span>
                  </div>
                </div>
                <div className="teaser-info">
                  <div className="teaser-tag-row">
                    <span className="teaser-dept-tag">{mock.dept}</span>
                    <span className="teaser-gender-tag">{mock.gender}</span>
                  </div>
                  <h4 className="teaser-name-blurred">••••••••••••</h4>
                  <div className="teaser-vibes">
                    <span className="teaser-vibe-pill">{mock.vibe}</span>
                  </div>
                  <p className="teaser-hint">A verified student in your orbit.</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Developer / Tester Preview Control */}
      <div className="unlock-preview-bar">
        <span>Evaluating app?</span>
        <Link href="/feed?preview=unlocked" className="preview-pill-link">
          Preview Unlocked Feed View →
        </Link>
      </div>

      {toast && <output className="toast">{toast}</output>}
    </div>
  );
}
