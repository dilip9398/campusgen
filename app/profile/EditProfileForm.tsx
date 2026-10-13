"use client";

import { useActionState, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Edit3,
  Heart,
  LockKeyhole,
  Save,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { updateMyProfile } from "@/app/auth/actions";
import type { FormState } from "@/app/auth/actions";
import { PhotoUpload } from "@/components/PhotoUpload";
import {
  campusHobbies,
  departments,
  genderOptions,
  graduationYears,
  interestedInOptions,
  statusLabels,
} from "@/lib/constants";
import {
  relationshipVibes,
  type Gender,
  type InterestedIn,
  type Profile,
  type RelationshipStatus,
} from "@/lib/types";

const input =
  "w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--rose)] focus:ring-2 focus:ring-[var(--rose)]/15";

const statusOptions: { value: RelationshipStatus; label: string }[] = [
  { value: "single", label: statusLabels.single },
  { value: "it_is_complicated", label: statusLabels.it_is_complicated },
  { value: "open_to_see", label: statusLabels.open_to_see },
];

export function EditProfileForm({ profile }: { profile: Profile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(updateMyProfile, {} as FormState);

  const [photo, setPhoto] = useState(profile.avatar_url);
  const [status, setStatus] = useState<RelationshipStatus>(profile.status);
  const [gender, setGender] = useState<Gender>(profile.gender || "male");
  const [interestedIn, setInterestedIn] = useState<InterestedIn>(profile.interested_in || "opposite");
  const [hobbies, setHobbies] = useState<string[]>(profile.hobbies || []);
  const [vibes, setVibes] = useState<string[]>(profile.relationship_vibes || []);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (state.message) {
      setNotice(state.message);
      setIsEditing(false);
    }
  }, [state.message]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function toggleHobby(hobby: string) {
    if (hobbies.includes(hobby)) {
      setHobbies(hobbies.filter((h) => h !== hobby));
    } else {
      if (hobbies.length >= 5) {
        setNotice("You can choose up to 5 campus interests.");
        return;
      }
      setHobbies([...hobbies, hobby]);
    }
  }

  function toggleVibe(vibe: string) {
    if (vibes.includes(vibe)) {
      setVibes(vibes.filter((v) => v !== vibe));
    } else {
      if (vibes.length >= 2) {
        setNotice("You can choose up to 2 relationship intentions.");
        return;
      }
      setVibes([...vibes, vibe]);
    }
  }

  return (
    <div className="profile-edit-section">
      <div className="profile-section-header">
        <div>
          <h2>Your Profile Details</h2>
          <p>Keep your hobbies, relationship status, and photo fresh.</p>
        </div>
        <button
          type="button"
          className="button button-secondary edit-toggle-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <X size={16} /> Cancel Editing
            </>
          ) : (
            <>
              <Edit3 size={16} /> Edit Profile
            </>
          )}
        </button>
      </div>

      {notice && <output className="toast">{notice}</output>}
      {state.error && <p className="form-alert" role="alert">{state.error}</p>}

      {!isEditing ? (
        <div className="profile-view-grid">
          <div className="profile-card-preview">
            <div className="info-group">
              <span className="info-label">RELATIONSHIP STATUS</span>
              <div className="status-badge-row">
                <span className="status-pill is-current">
                  {statusLabels[status]}
                </span>
              </div>
            </div>

            <div className="info-group">
              <span className="info-label">GENDER & PREFERENCE</span>
              <div className="gender-preference-tags">
                <span className="tag-pill">
                  {gender === "female" ? "♀ Woman" : gender === "male" ? "♂ Man" : "Non-binary"}
                </span>
                <span className="tag-pill highlight">
                  Looking for: {interestedIn === "opposite" ? "Opposite gender" : interestedIn === "female" ? "Women" : interestedIn === "male" ? "Men" : "Everyone"}
                </span>
              </div>
            </div>

            <div className="info-group">
              <span className="info-label">
                CAMPUS INTERESTS & HOBBIES ({hobbies.length}/5)
              </span>
              <div className="tag-row hobby-tags">
                {hobbies.length > 0 ? (
                  hobbies.map((h) => (
                    <span className="hobby-tag" key={h}>
                      {h}
                    </span>
                  ))
                ) : (
                  <span className="empty-hint">No hobbies added yet. Click &quot;Edit Profile&quot; to pick some!</span>
                )}
              </div>
            </div>

            <div className="info-group">
              <span className="info-label">
                RELATIONSHIP INTENTIONS ({vibes.length}/2)
              </span>
              <div className="tag-row">
                {vibes.length > 0 ? (
                  vibes.map((v) => (
                    <span className="vibe-tag" key={v}>
                      {v}
                    </span>
                  ))
                ) : (
                  <span className="empty-hint">No intentions picked yet.</span>
                )}
              </div>
            </div>

            <div className="info-group">
              <span className="info-label">PRIVATE CONTACT (REVEALED ON MATCH)</span>
              <div className="contact-preview-box">
                <LockKeyhole size={15} />
                <span>
                  {profile.contact_type === "instagram" ? "Instagram: " : "WhatsApp: "}
                  <strong>{profile.contact_handle}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form action={formAction} className="profile-edit-form form-stack">
          {/* Photo upload from device */}
          <div className="edit-form-block">
            <PhotoUpload
              value={photo}
              onChange={setPhoto}
              name="avatar_url"
              label="Profile Photo (Upload from phone/laptop or choose preset)"
            />
          </div>

          {/* Full name and department */}
          <div className="field-grid">
            <div>
              <label className="form-label" htmlFor="edit-name">Full Name</label>
              <input
                id="edit-name"
                className={input}
                name="full_name"
                defaultValue={profile.full_name}
                minLength={2}
                maxLength={60}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="edit-major">Department</label>
              <select
                id="edit-major"
                className={input}
                name="major"
                defaultValue={profile.major}
                required
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-grid">
            <div>
              <label className="form-label" htmlFor="edit-grad">Graduation Year</label>
              <select
                id="edit-grad"
                className={input}
                name="grad_year"
                defaultValue={profile.grad_year}
                required
              >
                {graduationYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="edit-status">
                Relationship Status
              </label>
              <select
                id="edit-status"
                className={input}
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as RelationshipStatus)}
                required
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender & Discovery feature */}
          <div className="field-grid">
            <div>
              <label className="form-label" htmlFor="edit-gender">My Gender</label>
              <select
                id="edit-gender"
                className={input}
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                required
              >
                {genderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="edit-interested">
                Feed Matching Mode
              </label>
              <select
                id="edit-interested"
                className={input}
                name="interested_in"
                value={interestedIn}
                onChange={(e) => setInterestedIn(e.target.value as InterestedIn)}
                required
              >
                {interestedInOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="form-label" htmlFor="edit-bio">
              Bio / About You <span className="label-aside">Up to 280 characters</span>
            </label>
            <textarea
              id="edit-bio"
              className={`${input} min-h-24 resize-y`}
              name="bio"
              defaultValue={profile.bio}
              maxLength={280}
              placeholder="Tell others what you love on campus..."
            />
          </div>

          {/* Hobbies Editing */}
          <div className="edit-form-block">
            <div className="section-kicker hobby-heading">
              <Sparkles size={16} /> CAMPUS HOBBIES & INTERESTS <span>{hobbies.length}/5</span>
            </div>
            <p className="field-note">
              Select or deselect what you enjoy around Siddhartha campus.
            </p>
            <div className="chip-grid">
              {campusHobbies.map((hobby) => {
                const picked = hobbies.includes(hobby);
                return (
                  <button
                    type="button"
                    key={hobby}
                    className={picked ? "choice-chip is-picked" : "choice-chip"}
                    onClick={() => toggleHobby(hobby)}
                    aria-pressed={picked}
                  >
                    {picked && <Check size={13} />}
                    {hobby}
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="hobbies" value={JSON.stringify(hobbies)} />
          </div>

          {/* Relationship Vibes Editing */}
          <div className="edit-form-block">
            <div className="section-kicker">
              <Heart size={16} /> RELATIONSHIP INTENTIONS <span>{vibes.length}/2</span>
            </div>
            <div className="choice-list">
              {relationshipVibes.map((vibe) => {
                const picked = vibes.includes(vibe);
                return (
                  <button
                    type="button"
                    key={vibe}
                    className={picked ? "vibe-choice is-picked" : "vibe-choice"}
                    onClick={() => toggleVibe(vibe)}
                    aria-pressed={picked}
                  >
                    <span className="choice-check">{picked && <Check size={14} />}</span>
                    <span className="choice-copy">
                      <strong>{vibe}</strong>
                    </span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="relationship_vibes" value={JSON.stringify(vibes)} />
          </div>

          {/* Contact Details */}
          <div className="field-grid">
            <div>
              <label className="form-label" htmlFor="edit-contact-type">
                Private Contact Type
              </label>
              <select
                id="edit-contact-type"
                className={input}
                name="contact_type"
                defaultValue={profile.contact_type}
              >
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="edit-contact-handle">
                Handle or WhatsApp Number
              </label>
              <input
                id="edit-contact-handle"
                className={input}
                name="contact_handle"
                defaultValue={profile.contact_handle}
                placeholder="@handle or +91..."
                required
              />
            </div>
          </div>

          <div className="profile-edit-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={isPending}
            >
              <Save size={16} />
              {isPending ? "Saving changes..." : "Save Profile"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
