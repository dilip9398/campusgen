import { cookies } from "next/headers";
import { defaultUserDemoProfile, initialDemoStudents } from "@/lib/demo-data";
import { getOppositeGender } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { DiscoveryProfile, Gender, Profile } from "@/lib/types";

const DEMO_COOKIE = "campuskin_demo_profile";
const DEMO_LIKES_COOKIE = "campuskin_demo_likes";
const DEMO_PASSES_COOKIE = "campuskin_demo_passes";

export async function getCurrentProfile(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const demoCookie = cookieStore.get(DEMO_COOKIE);

  if (demoCookie?.value) {
    try {
      const parsed = JSON.parse(demoCookie.value);
      return parsed as Profile;
    } catch {
      // Fall through to Supabase
    }
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc("get_my_profile");
    if (error || !data) return null;

    // Ensure gender fields exist with reasonable fallbacks
    return {
      gender: "male",
      interested_in: "opposite",
      ...data,
    } as Profile;
  } catch {
    // If Supabase is unreachable and demo cookie was not explicitly set,
    // in development return null so auth page can display login or demo option.
    return null;
  }
}

export async function setDemoProfile(profile: Profile) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, JSON.stringify(profile), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearDemoProfile() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);
  cookieStore.delete(DEMO_LIKES_COOKIE);
  cookieStore.delete(DEMO_PASSES_COOKIE);
}

export async function getFeedProfilesList(
  currentProfile: Profile,
  filterDept: string,
  filterVibe: string,
  filterGender: string
): Promise<DiscoveryProfile[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_feed_profiles", {
      p_department: filterDept || null,
      p_vibe: filterVibe || null,
      p_gender: filterGender || null,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((item) => ({
        ...item,
        gender: item.gender || "female",
      }));
    }
  } catch {
    // Fall back to demo dataset
  }

  const cookieStore = await cookies();
  const passedIds = new Set<string>();
  const likedIds = new Set<string>();

  const demoPasses = cookieStore.get(DEMO_PASSES_COOKIE)?.value;
  if (demoPasses) {
    try {
      (JSON.parse(demoPasses) as string[]).forEach((id) => passedIds.add(id));
    } catch {}
  }

  const demoLikes = cookieStore.get(DEMO_LIKES_COOKIE)?.value;
  if (demoLikes) {
    try {
      (JSON.parse(demoLikes) as string[]).forEach((id) => likedIds.add(id));
    } catch {}
  }

  // Determine target gender for opposite gender feature
  let targetGender: Gender | null = null;
  if (filterGender === "opposite") {
    targetGender = getOppositeGender(currentProfile.gender);
  } else if (filterGender === "female" || filterGender === "male" || filterGender === "other") {
    targetGender = filterGender as Gender;
  }

  return initialDemoStudents
    .filter((student) => student.id !== currentProfile.id)
    .filter((student) => !passedIds.has(student.id) && !likedIds.has(student.id))
    .filter((student) => (filterDept ? student.major === filterDept : true))
    .filter((student) => (filterVibe ? student.relationship_vibes.includes(filterVibe as any) : true))
    .filter((student) => (targetGender ? student.gender === targetGender : true))
    .map((student) => ({
      id: student.id,
      full_name: student.full_name,
      major: student.major,
      grad_year: student.grad_year,
      avatar_url: student.avatar_url,
      bio: student.bio,
      gender: student.gender,
      status: student.status,
      hobbies: student.hobbies,
      relationship_vibes: student.relationship_vibes,
    }));
}
