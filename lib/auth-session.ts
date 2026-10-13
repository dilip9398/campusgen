import { getOppositeGender } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { DiscoveryProfile, Gender, Profile } from "@/lib/types";

export function resolveProfileGender(profile: { full_name?: string; gender?: string }): Gender {
  if (profile.gender === "male" || profile.gender === "female" || profile.gender === "other") {
    return profile.gender as Gender;
  }
  const name = (profile.full_name || "").toLowerCase().trim();
  const femaleNames = ["aanya", "tara", "sia", "priya", "mira", "nila", "sneha", "ananya", "pooja", "divya", "kavya", "swathi", "deepa", "shreya", "anusha", "megha", "lakshmi"];
  const maleNames = ["aarav", "kiran", "arjun", "dev", "vikram", "rohan", "rahul", "aditya", "varun", "siddharth", "karthik", "sai", "pranav", "nikhil", "ravi"];

  for (const f of femaleNames) {
    if (name.includes(f)) return "female";
  }
  for (const m of maleNames) {
    if (name.includes(m)) return "male";
  }
  return "female";
}

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    // Try get_my_profile RPC
    const { data, error } = await supabase.rpc("get_my_profile");
    if (!error && data && typeof data === "object") {
      const raw = data as Record<string, any>;
      return {
        id: user.id,
        email: user.email || raw.email || "",
        full_name: raw.full_name || user.user_metadata?.full_name || "Student",
        major: raw.major || user.user_metadata?.major || "CSE",
        grad_year: raw.grad_year || user.user_metadata?.grad_year || 2026,
        avatar_url: raw.avatar_url || user.user_metadata?.avatar_url || "https://api.dicebear.com/9.x/notionists/svg?seed=Student",
        bio: raw.bio || "",
        gender: resolveProfileGender(raw),
        interested_in: raw.interested_in || "opposite",
        status: raw.status || "single",
        hobbies: Array.isArray(raw.hobbies) ? raw.hobbies : [],
        relationship_vibes: Array.isArray(raw.relationship_vibes) ? raw.relationship_vibes : [],
        contact_type: raw.contact_type || "instagram",
        contact_handle: raw.contact_handle || "",
        birth_date: raw.birth_date || user.user_metadata?.birth_date || "2002-01-01",
        created_at: raw.created_at || new Date().toISOString(),
      };
    }

    // Try direct select from profiles table
    const { data: directProfile, error: directError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!directError && directProfile) {
      return {
        id: user.id,
        email: user.email || directProfile.email || "",
        full_name: directProfile.full_name,
        major: directProfile.major,
        grad_year: directProfile.grad_year,
        avatar_url: directProfile.avatar_url,
        bio: directProfile.bio || "",
        gender: resolveProfileGender(directProfile),
        interested_in: directProfile.interested_in || "opposite",
        status: directProfile.status || "single",
        hobbies: Array.isArray(directProfile.hobbies) ? directProfile.hobbies : [],
        relationship_vibes: Array.isArray(directProfile.relationship_vibes) ? directProfile.relationship_vibes : [],
        contact_type: directProfile.contact_type || "instagram",
        contact_handle: directProfile.contact_handle || "",
        birth_date: directProfile.birth_date || user.user_metadata?.birth_date || "2002-01-01",
        created_at: directProfile.created_at || new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error("getCurrentProfile error:", error);
    return null;
  }
}

export async function getFeedProfilesList(
  currentProfile: Profile,
  filterDept: string,
  filterVibe: string,
  filterGender: string
): Promise<DiscoveryProfile[]> {
  const supabase = await createSupabaseServerClient();
  let rawProfiles: any[] = [];

  // Try RPC first
  try {
    const { data, error } = await supabase.rpc("get_feed_profiles", {
      p_department: filterDept || null,
      p_vibe: filterVibe || null,
    });
    if (!error && Array.isArray(data) && data.length > 0) {
      rawProfiles = data;
    }
  } catch {}

  // If RPC returned empty or errored, query public.profiles directly
  if (rawProfiles.length === 0) {
    try {
      let query = supabase
        .from("profiles")
        .select("id, full_name, major, grad_year, avatar_url, bio, status, hobbies, relationship_vibes")
        .neq("id", currentProfile.id);

      if (filterDept) {
        query = query.eq("major", filterDept);
      }
      if (filterVibe) {
        query = query.contains("relationship_vibes", [filterVibe]);
      }

      const { data: dbProfiles, error: dbError } = await query.limit(40);
      if (!dbError && Array.isArray(dbProfiles)) {
        rawProfiles = dbProfiles;
      }
    } catch (e) {
      console.error("Error fetching profiles from DB:", e);
    }
  }

  // Determine target gender for opposite gender feature
  let targetGender: Gender | null = null;
  if (filterGender === "opposite") {
    targetGender = getOppositeGender(currentProfile.gender);
  } else if (filterGender === "female" || filterGender === "male" || filterGender === "other") {
    targetGender = filterGender as Gender;
  }

  return rawProfiles
    .map((p) => {
      const g = resolveProfileGender(p);
      return {
        id: p.id,
        full_name: p.full_name,
        major: p.major,
        grad_year: p.grad_year,
        avatar_url: p.avatar_url,
        bio: p.bio || "",
        gender: g,
        status: p.status || "single",
        hobbies: Array.isArray(p.hobbies) ? p.hobbies : [],
        relationship_vibes: Array.isArray(p.relationship_vibes) ? p.relationship_vibes : [],
      };
    })
    .filter((p) => {
      if (targetGender && p.gender !== targetGender) {
        return false;
      }
      return true;
    });
}

export async function getCampusSignupCount(): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (!error && typeof count === "number") {
      return count;
    }
  } catch (err) {
    console.warn("getCampusSignupCount query notice:", err);
  }
  return 0;
}
