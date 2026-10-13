import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { MatchTile } from "@/components/MatchTile";
import type { Match } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentProfile } from "@/lib/auth-session";
import { cookies } from "next/headers";
import { initialDemoStudents } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth");

  let matches: Match[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.rpc("get_my_matches");
      if (Array.isArray(data)) {
        matches = data as Match[];
      }
    }
  } catch {}

  // If in demo mode and no supabase matches found, check demo likes
  if (matches.length === 0) {
    const cookieStore = await cookies();
    const demoLikes = cookieStore.get("campuskin_demo_likes")?.value;
    if (demoLikes) {
      try {
        const likedIds = JSON.parse(demoLikes) as string[];
        // Simulated matches from demo students
        matches = initialDemoStudents
          .filter((s) => likedIds.includes(s.id))
          .map((s) => ({
            id: s.id,
            profile_id: s.id,
            full_name: s.full_name,
            major: s.major,
            grad_year: s.grad_year,
            avatar_url: s.avatar_url,
            bio: s.bio,
            gender: s.gender,
            status: s.status,
            hobbies: s.hobbies,
            relationship_vibes: s.relationship_vibes,
            matched_at: new Date().toISOString(),
            contact_type: s.contact_type,
            contact_handle: s.contact_handle,
          }));
      } catch {}
    }
  }

  const myVibes = Array.isArray(profile.relationship_vibes) ? (profile.relationship_vibes as string[]) : [];

  return (
    <>
      <Navbar signedIn />
      <main className="app-frame matches-page">
        <div className="page-intro">
          <span className="eyebrow">WHEN IT GOES BOTH WAYS</span>
          <h1>
            Your <em>people.</em>
          </h1>
          <p>Mutual likes, unlocked handles, and somewhere good to start.</p>
        </div>

        {matches.length ? (
          <div className="matches-list">
            {matches.map((match) => (
              <MatchTile
                key={match.profile_id}
                match={match}
                sharedVibes={match.relationship_vibes.filter((vibe) => myVibes.includes(vibe))}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state matches-empty">
            <div className="empty-mark">
              <span>♥</span>
            </div>
            <h2>Your story starts with a like.</h2>
            <p>When you and someone both say yes, you’ll find each other here.</p>
            <a href="/feed" className="button button-primary">
              Explore campus
            </a>
          </div>
        )}
      </main>
    </>
  );
}
