import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { DiscoveryFeed } from "@/app/feed/DiscoveryFeed";
import { departments } from "@/lib/constants";
import { relationshipVibes } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function FeedPage({ searchParams }: {
  searchParams: Promise<{ department?: string; vibe?: string }>;
}) {
  const params = await searchParams;
  const department = departments.includes(params.department as (typeof departments)[number]) ? params.department! : "";
  const vibe = relationshipVibes.includes(params.vibe as (typeof relationshipVibes)[number]) ? params.vibe! : "";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const { data: myProfile } = await supabase.rpc("get_my_profile");
  if (!myProfile) redirect("/auth");

  const { data, error } = await supabase.rpc("get_feed_profiles", {
    p_department: department || null,
    p_vibe: vibe || null,
  });

  return <>
    <Navbar signedIn />
    <main className="app-frame feed-page">
      <div className="page-intro"><span className="eyebrow">THE SIDDHARTHA EDITION</span><h1>Meet someone<br /><em>in your orbit.</em></h1><p>Good people, same campus. Start with a hello when it feels right.</p></div>
      <form className="filter-bar" action="/feed">
        <label><span>Department</span><select name="department" defaultValue={department}><option value="">All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Intentions</span><select name="vibe" defaultValue={vibe}><option value="">All vibes</option>{relationshipVibes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <button className="filter-submit" type="submit">Apply</button>
      </form>
      {error ? <div className="empty-state"><h2>Discovery is taking a break.</h2><p>We couldn’t load campus profiles. Please refresh in a moment.</p></div> : <DiscoveryFeed profiles={data ?? []} />}
    </main>
  </>;
}
