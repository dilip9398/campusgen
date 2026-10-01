"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Heart, X } from "lucide-react";
import type { Match } from "@/lib/types";

const confettiColors = ["#dc5965", "#e8b84d", "#4d9b8e", "#7795d4", "#f29a73"];

export function MatchModal({ match, onClose }: Readonly<{ match: Match; onClose: () => void }>) {
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const socialUrl = match.contact_type === "instagram"
    ? `https://www.instagram.com/${match.contact_handle.replace(/^@/, "")}/`
    : `https://wa.me/${match.contact_handle.replace(/\D/g, "")}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  async function copyHandle() {
    try {
      await navigator.clipboard.writeText(match.contact_handle);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return <dialog ref={dialogRef} className="match-dialog" aria-labelledby="match-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="confetti-field" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ left: `${(index * 37) % 100}%`, animationDelay: `${(index % 9) * 0.12}s`, backgroundColor: confettiColors[index % confettiColors.length] }} />)}</div>
    <section className="match-modal">
      <button className="modal-close" onClick={onClose} aria-label="Close match"><X size={18} /></button>
      <div className="match-heart"><Heart size={24} fill="currentColor" /></div>
      <span className="eyebrow">THAT&apos;S A GOOD FEELING</span>
      <h2 id="match-title">It’s a mutual match!</h2>
      <p>You and {match.full_name} liked each other. Say hi when you’re ready.</p>
      <div className="match-avatars">
        <div className="match-avatar match-avatar-you"><span>you</span></div>
        <div className="match-avatar match-avatar-them"><Image src={match.avatar_url} alt={`${match.full_name}'s profile`} fill unoptimized sizes="76px" /></div>
      </div>
      <div className="unlocked-handle"><span>{match.contact_type === "instagram" ? "INSTAGRAM" : "WHATSAPP"}</span><strong>{match.contact_handle}</strong></div>
      <button className="button button-secondary button-wide" type="button" onClick={copyHandle}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy handle"}</button>
      <a className="button button-primary button-wide" href={socialUrl} target="_blank" rel="noreferrer">Open {match.contact_type === "instagram" ? "Instagram" : "WhatsApp"}<ArrowUpRight size={16} /></a>
      <button className="modal-later" onClick={onClose}>Keep discovering</button>
    </section>
  </dialog>;
}
