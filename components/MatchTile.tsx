"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, AtSign, Check, Copy, MessageCircle } from "lucide-react";
import type { Match } from "@/lib/types";

export function MatchTile({ match, sharedVibes }: { match: Match; sharedVibes: string[] }) {
  const [copied, setCopied] = useState(false);
  const whatsapp = match.contact_type === "whatsapp";
  const href = whatsapp
    ? `https://wa.me/${match.contact_handle.replace(/\D/g, "")}`
    : `https://www.instagram.com/${match.contact_handle.replace(/^@/, "")}/`;

  async function copyHandle() {
    try {
      await navigator.clipboard.writeText(match.contact_handle);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return <article className="match-tile">
    <div className="match-tile-photo"><Image src={match.avatar_url} alt={`${match.full_name}'s profile`} fill unoptimized sizes="(max-width: 600px) 38vw, 180px" /></div>
    <div className="match-tile-body">
      <span className="match-label">MUTUAL MATCH</span><h2>{match.full_name}</h2>
      <p className="match-meta">{match.major} <span>·</span> Class of {match.grad_year}</p>
      {sharedVibes.length > 0 && <div className="tag-row match-shared">{sharedVibes.map((vibe) => <span className="vibe-tag" key={vibe}>{vibe}</span>)}</div>}
      <div className="match-contact"><span className="contact-icon">{whatsapp ? <MessageCircle size={16} /> : <AtSign size={16} />}</span><strong>{match.contact_handle}</strong></div>
      <div className="match-tile-actions"><button type="button" className="copy-button" onClick={copyHandle}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy handle"}</button><a href={href} target="_blank" rel="noreferrer" className="open-social" aria-label={`Open ${whatsapp ? "WhatsApp" : "Instagram"} for ${match.full_name}`}><ArrowUpRight size={17} /></a></div>
    </div>
  </article>;
}
