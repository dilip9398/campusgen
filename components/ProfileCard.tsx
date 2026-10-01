"use client";

import Image from "next/image";
import { useState } from "react";
import { Heart, LockKeyhole, X } from "lucide-react";
import { likeProfile, passProfile } from "@/app/auth/actions";
import { MatchModal } from "@/components/MatchModal";
import { statusLabels } from "@/lib/constants";
import type { DiscoveryProfile, Match } from "@/lib/types";

export function ProfileCard({ profile, onNext }: { profile: DiscoveryProfile; onNext: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [match, setMatch] = useState<Match | null>(null);

  async function like() {
    setBusy(true);
    setError("");
    const result = await likeProfile(profile.id);
    setBusy(false);
    if (result.error) return setError(result.error);
    if (result.match) setMatch(result.match);
    else onNext(profile.id);
  }

  async function pass() {
    setBusy(true);
    setError("");
    const result = await passProfile(profile.id);
    setBusy(false);
    if (result.error) return setError(result.error);
    onNext(profile.id);
  }

  return <>
    <article className="profile-card">
      <div className="profile-photo">
        <Image src={profile.avatar_url} alt={`${profile.full_name}'s profile`} fill unoptimized sizes="(max-width: 560px) 100vw, 460px" priority />
        <div className="photo-shade" />
        <div className="photo-topline"><span className="status-pill">{statusLabels[profile.status]}</span><span className="campus-pill">Siddhartha · {profile.grad_year}</span></div>
        <div className="photo-caption"><span className="photo-major">{profile.major}</span><h2>{profile.full_name}</h2></div>
      </div>
      <div className="profile-details">
        <p className="profile-bio">{profile.bio || "Still writing my intro, but always up for a good campus break."}</p>
        {profile.relationship_vibes.length > 0 && <div className="tag-group"><span className="tag-label">LOOKING FOR</span><div className="tag-row">{profile.relationship_vibes.map((vibe) => <span className="vibe-tag" key={vibe}>{vibe}</span>)}</div></div>}
        {profile.hobbies.length > 0 && <div className="tag-row hobby-tags">{profile.hobbies.map((hobby) => <span className="hobby-tag" key={hobby}>{hobby}</span>)}</div>}
        <div className="locked-handle"><LockKeyhole size={16} aria-hidden="true" /><span>Match to unlock Instagram / WhatsApp</span></div>
        {error && <p className="form-alert" role="alert">{error}</p>}
        <div className="profile-actions">
          <button className="pass-button" type="button" onClick={pass} disabled={busy} aria-label="Pass on this profile" title="Pass"><X size={23} /></button>
          <span className="action-hint">Take your time</span>
          <button className="like-button" type="button" onClick={like} disabled={busy} aria-label="Like this profile" title="Like"><Heart size={22} fill="currentColor" /></button>
        </div>
      </div>
    </article>
    {match && <MatchModal match={match} onClose={() => { setMatch(null); onNext(profile.id); }} />}
  </>;
}
