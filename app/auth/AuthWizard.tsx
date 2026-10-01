"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, AtSign, Check, LockKeyhole, MessageCircle, Sparkles } from "lucide-react";
import { completeOnboarding } from "@/app/auth/actions";
import type { FormState } from "@/app/auth/actions";
import { CollegeAuthPanel } from "@/app/auth/CollegeAuthPanel";
import { avatarPresets, avatarUrl, campusHobbies, departments, graduationYears, statusLabels } from "@/lib/constants";
import { relationshipVibes, type RelationshipStatus } from "@/lib/types";

const input = "w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--rose)] focus:ring-2 focus:ring-[var(--rose)]/15";
const statusOptions: { value: RelationshipStatus; label: string }[] = [
  { value: "single", label: statusLabels.single },
  { value: "it_is_complicated", label: statusLabels.it_is_complicated },
  { value: "open_to_see", label: statusLabels.open_to_see },
];
const vibeDescriptions = [
  "Warm, cozy companionship for the semester.", "Genuine connection with room to grow.",
  "Good chemistry, no heavy labels for now.", "Keeping it social and meeting new people.",
  "Cafes, street food, movies and campus breaks.", "Library sessions with a canteen chai after.",
  "A close, everyday kind of connection.", "Start as friends and see what feels right.",
];
const phaseCopy = {
  1: { title: "Your campus, your people.", description: "Start with your college ID. We'll verify it before anyone can see your profile." },
  2: { title: "Make it feel like you.", description: "A few details help the right people find you." },
  3: { title: "Set your intentions.", description: "Choose up to two. Honest beats impressive." },
} as const;

export function AuthWizard({ initialPhase, initialBirthDate, verificationError = false }: Readonly<{
  initialPhase: 1 | 2;
  initialBirthDate: string;
  verificationError?: boolean;
}>) {
  const [phase, setPhase] = useState<1 | 2 | 3>(initialPhase);
  const [profile, profileAction, profilePending] = useActionState(completeOnboarding, {} as FormState);
  const [photo, setPhoto] = useState(avatarUrl("Campus Kin"));
  const [vibes, setVibes] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const currentCopy = phaseCopy[phase];

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function toggleChoice(value: string, current: string[], setter: (next: string[]) => void, limit: number, label: string) {
    if (current.includes(value)) setter(current.filter((item) => item !== value));
    else if (current.length >= limit) setNotice(`You can only select up to ${limit} ${label}.`);
    else setter([...current, value]);
  }

  return (
    <main className="auth-shell"><div className="auth-wrap">
      <Link href="/" className="wordmark"><span className="wordmark-mark">c.</span> campus kin</Link>
      <div className="auth-heading"><span className="eyebrow">SIDDHARTHA STUDENTS, ONLY</span>
        <h1>{currentCopy.title}</h1>
        <p>{currentCopy.description}</p>
      </div>
      <div className="step-track" aria-label={`Step ${phase} of 3`}>{[1, 2, 3].map((step) => <span key={step} className={step <= phase ? "step-dot is-active" : "step-dot"} />)}<span className="step-caption">STEP {phase} OF 3</span></div>

      {phase === 1 ? <CollegeAuthPanel initialBirthDate={initialBirthDate} verificationError={verificationError} /> : <form ref={form} action={profileAction} className="auth-panel form-stack">
        {!initialBirthDate && <><label className="form-label" htmlFor="profile-birth-date">Date of birth <span className="label-aside">18+ only</span></label><input id="profile-birth-date" className={input} type="date" name="birth_date" max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)} required /></>}
        {initialBirthDate && <input type="hidden" name="birth_date" value={initialBirthDate} />}
        <div hidden={phase !== 2}>
          <div className="photo-row"><div className="photo-preview"><Image src={photo} alt="Profile photo preview" fill unoptimized sizes="96px" /></div>
            <div className="photo-controls"><label className="form-label" htmlFor="avatar-url">Your photo URL</label>
              <input id="avatar-url" className={input} name="avatar_url" type="url" value={photo} onChange={(event) => setPhoto(event.target.value)} placeholder="https://..." required />
              <div className="preset-row" aria-label="Choose an avatar preset">{avatarPresets.map((preset) => <button type="button" key={preset} className={photo === avatarUrl(preset) ? "avatar-preset is-picked" : "avatar-preset"} onClick={() => setPhoto(avatarUrl(preset))} aria-label={`Use ${preset} avatar`} title={`${preset} avatar`}><Image src={avatarUrl(preset)} alt="" width={34} height={34} unoptimized /></button>)}</div>
            </div>
          </div>
          <label className="form-label" htmlFor="full-name">Full name</label><input id="full-name" className={input} name="full_name" minLength={2} maxLength={60} autoComplete="name" required />
          <div className="field-grid"><div><label className="form-label" htmlFor="major">Department</label><select id="major" className={input} name="major" defaultValue="" required><option value="" disabled>Select</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div><label className="form-label" htmlFor="grad-year">Grad year</label><select id="grad-year" className={input} name="grad_year" defaultValue="" required><option value="" disabled>Select</option>{graduationYears.map((year) => <option key={year}>{year}</option>)}</select></div>
          </div>
          <label className="form-label" htmlFor="status">Relationship status</label><select id="status" className={input} name="status" defaultValue="single">{statusOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select>
          <label className="form-label" htmlFor="bio">A little about you <span className="label-aside">Optional</span></label><textarea id="bio" className={`${input} min-h-24 resize-y`} name="bio" maxLength={280} placeholder="The playlist you defend, your ideal campus break..." />
          <div className="privacy-note"><LockKeyhole size={17} aria-hidden="true" /><div><strong>Your contact stays yours.</strong><span>Instagram or WhatsApp is hidden until you both like each other.</span></div></div>
          <div className="field-grid"><div><label className="form-label" htmlFor="contact-type">Share after a match</label><select id="contact-type" className={input} name="contact_type" defaultValue="instagram"><option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option></select></div>
            <div><label className="form-label" htmlFor="contact-handle">Your handle / number</label><input id="contact-handle" className={input} name="contact_handle" placeholder="@handle or +91..." required /></div>
          </div>
          <button className="button button-primary button-wide" type="button" onClick={() => { if (form.current?.reportValidity()) setPhase(3); }}>Choose my vibe <ArrowRight size={17} aria-hidden="true" /></button>
        </div>
        <div hidden={phase !== 3}>
          <div className="section-kicker"><Sparkles size={16} aria-hidden="true" /> RELATIONSHIP INTENTIONS <span>{vibes.length}/2</span></div>
          <div className="choice-list">{relationshipVibes.map((vibe, index) => <button type="button" key={vibe} onClick={() => toggleChoice(vibe, vibes, setVibes, 2, "relationship intentions")} className={vibes.includes(vibe) ? "vibe-choice is-picked" : "vibe-choice"} aria-pressed={vibes.includes(vibe)}>
            <span className="choice-check">{vibes.includes(vibe) && <Check size={14} />}</span><span className="choice-copy"><strong>{vibe}</strong><small>{vibeDescriptions[index]}</small></span>
          </button>)}</div>
          <input type="hidden" name="relationship_vibes" value={JSON.stringify(vibes)} />
          <div className="section-kicker hobby-heading">CAMPUS INTERESTS <span>{hobbies.length}/5</span></div>
          <div className="chip-grid">{campusHobbies.map((hobby) => <button type="button" key={hobby} className={hobbies.includes(hobby) ? "choice-chip is-picked" : "choice-chip"} aria-pressed={hobbies.includes(hobby)} onClick={() => toggleChoice(hobby, hobbies, setHobbies, 5, "campus interests")}>{hobbies.includes(hobby) && <Check size={13} />}{hobby}</button>)}</div>
          <input type="hidden" name="hobbies" value={JSON.stringify(hobbies)} />
          {profile.error && <p className="form-alert" role="alert">{profile.error}</p>}
          <div className="wizard-actions"><button className="button button-secondary" type="button" onClick={() => setPhase(2)}><ArrowLeft size={16} aria-hidden="true" /> Back</button><button className="button button-primary" type="submit" disabled={profilePending}>{profilePending ? "Saving..." : "Finish profile"}<ArrowRight size={17} aria-hidden="true" /></button></div>
        </div>
      </form>}
      <p className="lexicon-link">Not sure what you’re looking for? <Link href="/lexicon">Read the vibe bible <ArrowRight size={13} aria-hidden="true" /></Link></p>
      <div className="auth-signals"><span><AtSign size={14} /> verified campus IDs</span><span><MessageCircle size={14} /> handles stay private</span></div>
      {notice && <output className="toast">{notice}</output>}
    </div></main>
  );
}
