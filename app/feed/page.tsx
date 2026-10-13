import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Unlock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { DiscoveryFeed } from "@/app/feed/DiscoveryFeed";
import { FeedLocked143 } from "@/components/FeedLocked143";
import { departments, genderLabels, getOppositeGender } from "@/lib/constants";
import { relationshipVibes } from "@/lib/types";
import { getCampusSignupCount, getCurrentProfile, getFeedProfilesList } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function FeedPage({ searchParams }: {
  searchParams: Promise<{ department?: string; vibe?: string; gender?: string; preview?: string }>;
}) {
  const params = await searchParams;
  const myProfile = await getCurrentProfile();
  if (!myProfile) redirect("/auth");

  const signupCount = await getCampusSignupCount();
  const UNLOCK_GOAL = 50;
  const isUnlocked = signupCount >= UNLOCK_GOAL || params.preview === "unlocked";

  const department = departments.includes(params.department as (typeof departments)[number]) ? params.department! : "";
  const vibe = relationshipVibes.includes(params.vibe as (typeof relationshipVibes)[number]) ? params.vibe! : "";
  const gender = params.gender || "opposite";

  const profiles = await getFeedProfilesList(myProfile, department, vibe, gender);

  const opposite = getOppositeGender(myProfile.gender);
  const oppositeText = opposite ? (opposite === "female" ? "women" : "men") : "everyone";

  return (
    <>
      <Navbar signedIn />
      <main className="app-frame feed-page">
        {/* If count is below 50, render the curiosity-driven locked screen */}
        {!isUnlocked ? (
          <FeedLocked143
            count={signupCount}
            goal={UNLOCK_GOAL}
            profiles={profiles}
            myProfile={myProfile}
          />
        ) : (
          <>
            {/* 50 Milestone Celebratory Banner */}
            <div className="feed-unlocked-banner">
              <div className="unlocked-banner-badge">
                <Sparkles size={15} /> 50 MILESTONE ACHIEVED
              </div>
              <div className="unlocked-banner-content">
                <h3>🎉 The Siddhartha Campus Feed is Officially Unlocked!</h3>
                <p>
                  50 students have joined the campus circle. Browse, like, and discover who is in your orbit.
                </p>
              </div>
              {params.preview === "unlocked" && (
                <Link href="/feed" className="preview-back-pill">
                  View 50 Counter
                </Link>
              )}
            </div>

            <div className="page-intro">
              <span className="eyebrow">THE SIDDHARTHA EDITION</span>
              <h1>
                Meet someone<br />
                <em>in your orbit.</em>
              </h1>
              <p>
                {gender === "opposite"
                  ? `Currently showing verified Siddhartha ${oppositeText} (${genderLabels[myProfile.gender]} profile active).`
                  : "Good people, same campus. Start with a hello when it feels right."}
              </p>
            </div>

            <form className="filter-bar" action="/feed">
              {params.preview === "unlocked" && <input type="hidden" name="preview" value="unlocked" />}
              <label>
                <span>Gender Match</span>
                <select name="gender" defaultValue={gender}>
                  <option value="opposite">Opposite gender ({oppositeText})</option>
                  <option value="female">Women only</option>
                  <option value="male">Men only</option>
                  <option value="all">All genders</option>
                </select>
              </label>
              <label>
                <span>Department</span>
                <select name="department" defaultValue={department}>
                  <option value="">All departments</option>
                  {departments.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Intentions</span>
                <select name="vibe" defaultValue={vibe}>
                  <option value="">All vibes</option>
                  {relationshipVibes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <button className="filter-submit" type="submit">
                Apply
              </button>
            </form>

            <DiscoveryFeed profiles={profiles} />
          </>
        )}
      </main>
    </>
  );
}
