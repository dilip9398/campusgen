import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { MatchTile } from "@/components/MatchTile";
import type { Match } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentProfile } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth");

  let matches: Match[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.rpc("get_my_matches");
      if (!error && Array.isArray(data)) {
        matches = data as Match[];
      }
    }
  } catch (err) {
    console.error("Error loading matches from Supabase:", err);
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
