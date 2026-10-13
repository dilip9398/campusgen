"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, AtSign, Check, LockKeyhole, MessageCircle, Sparkles } from "lucide-react";
import { completeOnboarding } from "@/app/auth/actions";
import type { FormState } from "@/app/auth/actions";
import { CollegeAuthPanel } from "@/app/auth/CollegeAuthPanel";
import { PhotoUpload } from "@/components/PhotoUpload";
import {
  avatarUrl,
  campusHobbies,
  departments,
  genderOptions,
  graduationYears,
  interestedInOptions,
  statusLabels,
} from "@/lib/constants";
import {
  relationshipVibes,
  type ContactType,
  type Gender,
  type InterestedIn,
  type RelationshipStatus,
} from "@/lib/types";

const input =
  "w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--rose)] focus:ring-2 focus:ring-[var(--rose)]/15";

const statusOptions: { value: RelationshipStatus; label: string }[] = [
  { value: "single", label: statusLabels.single },
  { value: "it_is_complicated", label: statusLabels.it_is_complicated },
  { value: "open_to_see", label: statusLabels.open_to_see },
];

const vibeDescriptions = [
  "Warm, cozy companionship for the semester.",
  "Genuine connection with room to grow.",
  "Good chemistry, no heavy labels for now.",
  "Keeping it social and meeting new people.",
  "Cafes, street food, movies and campus breaks.",
  "Library sessions with a canteen chai after.",
  "A close, everyday kind of connection.",
  "Start as friends and see what feels right.",
];

const phaseCopy = {
  1: {
    badge: "SIDDHARTHA STUDENTS, ONLY",
    title: "Your campus, your people.",
    description: "Start with your college ID. We verify every student before entering the campus circle.",
  },
  2: {
    badge: "STEP 2 OF 4 • IDENTITY",
    title: "Tell us who you are.",
    description: "Your name, department, and who you're excited to meet across Siddhartha campus.",
  },
  3: {
    badge: "STEP 3 OF 4 • PRESENCE",
    title: "Make your presence real.",
    description: "Upload a picture from your device. Your contact handle is hidden until a mutual match.",
  },
  4: {
    badge: "STEP 4 OF 4 • VIBES",
    title: "Campus hobbies & vibes.",
    description: "Pick up to 5 campus activities and up to 2 relationship intentions to match your energy.",
  },
} as const;

export function AuthWizard({
  initialPhase = 1,
  initialBirthDate = "",
  initialEmail = "",
  initialFullName = "",
  initialMajor = "CSE",
  initialGradYear = 2026,
  initialGender = "female",
}: Readonly<{
  initialPhase: 1 | 2 | 3 | 4;
  initialBirthDate?: string;
  initialEmail?: string;
  initialFullName?: string;
  initialMajor?: string;
  initialGradYear?: number;
  initialGender?: Gender;
  verificationError?: boolean;
}>) {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(initialPhase);
  const [email, setEmail] = useState(initialEmail);

  // Step 2: Identity & Details
  const [fullName, setFullName] = useState(initialFullName);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [major, setMajor] = useState(initialMajor);
  const [gradYear, setGradYear] = useState(initialGradYear);
  const [gender, setGender] = useState<Gender>(initialGender);
  const [interestedIn, setInterestedIn] = useState<InterestedIn>("opposite");

  // Step 3: Media & Contact
  const [photo, setPhoto] = useState(avatarUrl("Campus Kin"));
  const [status, setStatus] = useState<RelationshipStatus>("single");
  const [bio, setBio] = useState("");
  const [contactType, setContactType] = useState<ContactType>("instagram");
  const [contactHandle, setContactHandle] = useState("");

  // Step 4: Interests & Vibes
  const [vibes, setVibes] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);

  const [profile, profileAction, profilePending] = useActionState(completeOnboarding, {} as FormState);
  const [notice, setNotice] = useState("");

  const currentCopy = phaseCopy[phase];
  const maxAdultDate = new Date(new Date().setFullYear(new Date().getFullYear() - 18))
    .toISOString()
    .slice(0, 10);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function toggleChoice(
    value: string,
    current: string[],
    setter: (next: string[]) => void,
    limit: number,
    label: string
  ) {
    if (current.includes(value)) {
      setter(current.filter((item) => item !== value));
    } else if (current.length >= limit) {
      setNotice(`You can select up to ${limit} ${label}.`);
    } else {
      setter([...current, value]);
    }
  }

  function handleStep2Continue() {
    const trimmed = fullName.trim();
    if (!trimmed || trimmed.length < 2) {
      setNotice("Please enter your name (at least 2 characters).");
      return;
    }
    if (!birthDate) {
      setNotice("Please choose your date of birth.");
      return;
    }
    const dob = new Date(`${birthDate}T00:00:00.000Z`);
    const cutoff = new Date();
    cutoff.setUTCHours(0, 0, 0, 0);
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
    if (dob > cutoff) {
      setNotice("You must be at least 18 to use Campus Kin.");
      return;
    }
    setPhase(3);
  }

  function handleStep3Continue() {
    if (!photo) {
      setNotice("Please upload a profile photo or select an avatar.");
      return;
    }
    const handle = contactHandle.trim();
    if (!handle) {
      setNotice("Please enter your handle or phone number for matches.");
      return;
    }
    if (contactType === "instagram" && !/^@?[A-Za-z0-9._]{1,30}$/.test(handle)) {
      setNotice("Enter a valid Instagram username (e.g. @your_name).");
      return;
    }
    if (contactType === "whatsapp" && !/^\+[1-9]\d{7,14}$/.test(handle)) {
      setNotice("Enter a valid WhatsApp number with country code (e.g. +919876543210).");
      return;
    }
    setPhase(4);
  }

  function handleStep4Submit(e: React.FormEvent) {
    if (hobbies.length === 0) {
      e.preventDefault();
      setNotice("Please select at least 1 campus interest.");
      return;
    }
    if (vibes.length === 0) {
      e.preventDefault();
      setNotice("Please select at least 1 relationship intention.");
      return;
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-wrap">
        <Link href="/" className="wordmark">
          <span className="wordmark-mark">c.</span> campus kin
        </Link>

        <div className="auth-heading">
          <span className="eyebrow">{currentCopy.badge}</span>
          <h1>{currentCopy.title}</h1>
          <p>{currentCopy.description}</p>
        </div>

        {/* 4-Step Visual Tracker */}
        <div className="step-track" aria-label={`Step ${phase} of 4`}>
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={step <= phase ? "step-dot is-active" : "step-dot"}
              title={`Step ${step}`}
            />
          ))}
          <span className="step-caption">STEP {phase} OF 4</span>
        </div>

        {/* Step 1: Account Access */}
        {phase === 1 ? (
          <CollegeAuthPanel
            initialBirthDate={birthDate}
            onAccountCreated={(details) => {
              if (details.email) setEmail(details.email);
              setPhase(2);
            }}
          />
        ) : (
          <form action={profileAction} className="auth-panel form-stack" onSubmit={handleStep4Submit}>
            {/* Step 2: Student Identity & Details */}
            <div hidden={phase !== 2} className="form-stack">
              <div className="step-prompt-header">
                <span className="step-subkicker">STEP 2 OF 4</span>
                <h2 className="step-panel-title">Student Identity & Details</h2>
                <p className="step-panel-desc">
                  Tell us who you are. These details appear on your campus profile.
                </p>
              </div>

              <label className="form-label" htmlFor="full-name">
                Full name / Username
              </label>
              <input
                id="full-name"
                className={input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                minLength={2}
                maxLength={60}
                autoComplete="name"
                placeholder="e.g. Aarav Sharma"
              />

              <label className="form-label" htmlFor="birth-date">
                Date of birth <span className="label-aside">18+ only • Required</span>
              </label>
              <input
                id="birth-date"
                className={input}
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={maxAdultDate}
              />

              <div className="field-grid">
                <div>
                  <label className="form-label" htmlFor="major">
                    Department
                  </label>
                  <select
                    id="major"
                    className={input}
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                  >
                    {departments.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="grad-year">
                    Grad year
                  </label>
                  <select
                    id="grad-year"
                    className={input}
                    value={gradYear}
                    onChange={(e) => setGradYear(Number(e.target.value))}
                  >
                    {graduationYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-grid">
                <div>
                  <label className="form-label" htmlFor="gender">
                    I identify as
                  </label>
                  <select
                    id="gender"
                    className={input}
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                  >
                    {genderOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="interested_in">
                    Interested in seeing
                  </label>
                  <select
                    id="interested_in"
                    className={input}
                    value={interestedIn}
                    onChange={(e) => setInterestedIn(e.target.value as InterestedIn)}
                  >
                    {interestedInOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="wizard-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setPhase(1)}
                >
                  <ArrowLeft size={16} aria-hidden="true" /> Back
                </button>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={handleStep2Continue}
                >
                  Continue to Photo <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Step 3: Media & Presence */}
            <div hidden={phase !== 3} className="form-stack">
              <div className="step-prompt-header">
                <span className="step-subkicker">STEP 3 OF 4</span>
                <h2 className="step-panel-title">Profile Photo & Presence</h2>
                <p className="step-panel-desc">
                  Upload a picture from your device. Your contact handle is hidden until a mutual match.
                </p>
              </div>

              <PhotoUpload
                value={photo}
                onChange={setPhoto}
                name="avatar_url"
                label="Profile photo (upload from device or pick preset)"
              />

              <label className="form-label" htmlFor="status">
                Relationship status
              </label>
              <select
                id="status"
                className={input}
                value={status}
                onChange={(e) => setStatus(e.target.value as RelationshipStatus)}
              >
                {statusOptions.map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <label className="form-label" htmlFor="bio">
                A little about you <span className="label-aside">Optional</span>
              </label>
              <textarea
                id="bio"
                className={`${input} min-h-24 resize-y`}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
                placeholder="The playlist you defend, your ideal campus break spot..."
              />

              <div className="privacy-note">
                <LockKeyhole size={17} aria-hidden="true" />
                <div>
                  <strong>Your contact stays 100% private.</strong>
                  <span>Instagram or WhatsApp is locked until both of you mutually like each other.</span>
                </div>
              </div>

              <div className="field-grid">
                <div>
                  <label className="form-label" htmlFor="contact-type">
                    Share after match
                  </label>
                  <select
                    id="contact-type"
                    className={input}
                    value={contactType}
                    onChange={(e) => setContactType(e.target.value as ContactType)}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="contact-handle">
                    Handle / Number
                  </label>
                  <input
                    id="contact-handle"
                    className={input}
                    value={contactHandle}
                    onChange={(e) => setContactHandle(e.target.value)}
                    placeholder={contactType === "instagram" ? "@handle" : "+91..."}
                  />
                </div>
              </div>

              <div className="wizard-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setPhase(2)}
                >
                  <ArrowLeft size={16} aria-hidden="true" /> Back
                </button>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={handleStep3Continue}
                >
                  Continue to Vibes <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Step 4: Campus Hobbies & Intentions */}
            <div hidden={phase !== 4} className="form-stack">
              <div className="step-prompt-header">
                <span className="step-subkicker">STEP 4 OF 4</span>
                <h2 className="step-panel-title">Hobbies & Campus Vibes</h2>
                <p className="step-panel-desc">
                  Pick up to 5 campus activities and up to 2 relationship intentions to match your energy.
                </p>
              </div>

              <div className="section-kicker">
                <Sparkles size={16} aria-hidden="true" /> RELATIONSHIP INTENTIONS <span>{vibes.length}/2</span>
              </div>
              <div className="choice-list">
                {relationshipVibes.map((vibe, index) => (
                  <button
                    type="button"
                    key={vibe}
                    onClick={() => toggleChoice(vibe, vibes, setVibes, 2, "relationship intentions")}
                    className={vibes.includes(vibe) ? "vibe-choice is-picked" : "vibe-choice"}
                    aria-pressed={vibes.includes(vibe)}
                  >
                    <span className="choice-check">{vibes.includes(vibe) && <Check size={14} />}</span>
                    <span className="choice-copy">
                      <strong>{vibe}</strong>
                      <small>{vibeDescriptions[index]}</small>
                    </span>
                  </button>
                ))}
              </div>

              <div className="section-kicker hobby-heading">
                CAMPUS INTERESTS <span>{hobbies.length}/5</span>
              </div>
              <div className="chip-grid">
                {campusHobbies.map((hobby) => (
                  <button
                    type="button"
                    key={hobby}
                    className={hobbies.includes(hobby) ? "choice-chip is-picked" : "choice-chip"}
                    aria-pressed={hobbies.includes(hobby)}
                    onClick={() => toggleChoice(hobby, hobbies, setHobbies, 5, "campus interests")}
                  >
                    {hobbies.includes(hobby) && <Check size={13} />}
                    {hobby}
                  </button>
                ))}
              </div>

              {/* Hidden fields submitting all values to server */}
              <input type="hidden" name="full_name" value={fullName.trim()} />
              <input type="hidden" name="birth_date" value={birthDate} />
              <input type="hidden" name="major" value={major} />
              <input type="hidden" name="grad_year" value={gradYear} />
              <input type="hidden" name="gender" value={gender} />
              <input type="hidden" name="interested_in" value={interestedIn} />
              <input type="hidden" name="avatar_url" value={photo} />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="bio" value={bio.trim()} />
              <input type="hidden" name="contact_type" value={contactType} />
              <input type="hidden" name="contact_handle" value={contactHandle.trim()} />
              <input type="hidden" name="hobbies" value={JSON.stringify(hobbies)} />
              <input type="hidden" name="relationship_vibes" value={JSON.stringify(vibes)} />

              {profile.error && (
                <p className="form-alert" role="alert">
                  {profile.error}
                </p>
              )}

              <div className="wizard-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setPhase(3)}
                >
                  <ArrowLeft size={16} aria-hidden="true" /> Back
                </button>
                <button className="button button-primary" type="submit" disabled={profilePending}>
                  {profilePending ? "Creating profile..." : "Finish profile & Enter feed"}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
          </form>
        )}

        <p className="lexicon-link">
          Not sure what you’re looking for?{" "}
          <Link href="/lexicon">
            Read the vibe bible <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </p>
        <div className="auth-signals">
          <span>
            <AtSign size={14} /> verified campus IDs
          </span>
          <span>
            <MessageCircle size={14} /> handles stay private
          </span>
        </div>
        {notice && <output className="toast">{notice}</output>}
      </div>
    </main>
  );
}
