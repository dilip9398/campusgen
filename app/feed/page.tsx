import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { DiscoveryFeed } from "@/app/feed/DiscoveryFeed";
import { departments, genderLabels, getOppositeGender } from "@/lib/constants";
import { relationshipVibes } from "@/lib/types";
import { getCurrentProfile, getFeedProfilesList } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function FeedPage({ searchParams }: {
  searchParams: Promise<{ department?: string; vibe?: string; gender?: string }>;
}) {
  const params = await searchParams;
  const myProfile = await getCurrentProfile();
  if (!myProfile) redirect("/auth");

  const department = departments.includes(params.department as (typeof departments)[number]) ? params.department! : "";
  const vibe = relationshipVibes.includes(params.vibe as (typeof relationshipVibes)[number]) ? params.vibe! : "";
  // Default to opposite gender feature if not specified
  const gender = params.gender || "opposite";

  const profiles = await getFeedProfilesList(myProfile, department, vibe, gender);

  const opposite = getOppositeGender(myProfile.gender);
  const oppositeText = opposite ? (opposite === "female" ? "women" : "men") : "everyone";

  return (
    <>
      <Navbar signedIn />
      <main className="app-frame feed-page">
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
      </main>
    </>
  );
}
