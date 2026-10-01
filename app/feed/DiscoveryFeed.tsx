"use client";

import { useState } from "react";
import { Heart, Sparkles } from "lucide-react";
import { ProfileCard } from "@/components/ProfileCard";
import type { DiscoveryProfile } from "@/lib/types";

export function DiscoveryFeed({ profiles }: { profiles: DiscoveryProfile[] }) {
  const [remaining, setRemaining] = useState(profiles);
  const active = remaining[0];

  function removeProfile(id: string) {
    setRemaining((current) => current.filter((profile) => profile.id !== id));
  }

  if (!active) return <div className="empty-state">
    <div className="empty-mark"><Heart size={24} /></div>
    <h2>You’re all caught up.</h2>
    <p>More Siddhartha students will show up as they join. Your likes and passes stay saved.</p>
  </div>;

  return <div className="discovery-stage">
    <div className="feed-count"><span><Sparkles size={14} /> YOUR CAMPUS CIRCLE</span><span>{remaining.length} {remaining.length === 1 ? "profile" : "profiles"}</span></div>
    <ProfileCard key={active.id} profile={active} onNext={removeProfile} />
    <p className="feed-footnote">Private college IDs. Real campus connections.</p>
  </div>;
}
