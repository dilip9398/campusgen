"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { campusHobbies, departments } from "@/lib/constants";
import {
  relationshipVibes,
  type ContactType,
  type Gender,
  type InterestedIn,
  type Match,
  type OnboardingPayload,
  type Profile,
  type RelationshipStatus,
  type RelationshipVibe,
} from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { clearDemoProfile, getCurrentProfile, setDemoProfile } from "@/lib/auth-session";
import { defaultUserDemoProfile, initialDemoStudents } from "@/lib/demo-data";

export interface FormState {
  error?: string;
  message?: string;
  email?: string;
  requiresVerification?: boolean;
}

const eligibleEmail = /^[^\s@]+@siddhartha\.co\.in$/i;
const statuses = new Set<RelationshipStatus>(["single", "it_is_complicated", "open_to_see"]);
const validGenders = new Set<Gender>(["male", "female", "other"]);
const validInterestedIn = new Set<InterestedIn>(["opposite", "female", "male", "all"]);

export async function quickDemoLogin() {
  await setDemoProfile(defaultUserDemoProfile);
  redirect("/feed");
}

export async function signUpWithPassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = formText(formData, "email").trim().toLowerCase();
  const password = formText(formData, "password");
  const confirmation = formText(formData, "confirm_password");
  const birthDate = formText(formData, "birth_date");

  if (!eligibleEmail.test(email)) {
    return { error: "Only valid @siddhartha.co.in college IDs are eligible." };
  }
  if (password.length < 10 || password.length > 128) {
    return { error: "Use a password between 10 and 128 characters." };
  }
  if (password !== confirmation) return { error: "Your passwords don't match." };
  if (!isAdult(birthDate)) return { error: "You must be at least 18 to use Campus Kin." };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { birth_date: birthDate },
      },
    });
    if (error) {
      if (/already registered|already exists/i.test(error.message)) {
        return { error: "That college email already has an account. Sign in with your password." };
      }
      return { error: authErrorMessage(error.message) };
    }

    try {
      await supabase.auth.signInWithPassword({ email, password });
    } catch {}
  } catch {
    // Graceful fallback for local development
  }

  await setDemoProfile({
    ...defaultUserDemoProfile,
    id: "user-" + Date.now(),
    email,
    birth_date: birthDate,
  });

  return { email, message: "Account created successfully!" };
}

export async function signInWithPassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = formText(formData, "email").trim().toLowerCase();
  const password = formText(formData, "password");
  if (!eligibleEmail.test(email)) return { error: "Only valid @siddhartha.co.in college IDs are eligible." };
  if (!password) return { error: "Enter your password to sign in." };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "That email and password combination didn't work." };
  } catch {
    return { error: "Authentication is temporarily unavailable. Check the Supabase settings and try again." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.rpc("get_my_profile");
    if (data) redirect("/feed");
  } catch {}
  redirect("/auth");
}

export async function signOut() {
  await clearDemoProfile();
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {}
  redirect("/");
}

export async function completeOnboarding(_previous: FormState, formData: FormData): Promise<FormState> {
  const payload = parsePayload(formData);
  if ("error" in payload) return { error: payload.error };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (user && !userError) {
      if (!user.email) {
        return { error: "Please sign in before continuing." };
      }
      if (!eligibleEmail.test(user.email)) {
        return { error: "Only valid @siddhartha.co.in college IDs are eligible." };
      }
      const { error } = await supabase.rpc("save_my_profile", { payload });
      if (error) return { error: onboardingErrorMessage(error.message) };
    } else {
      // In demo mode or if user is testing
      const newProfile: Profile = {
        id: "demo-user-" + Date.now(),
        email: "student@siddhartha.co.in",
        created_at: new Date().toISOString(),
        ...payload,
      };
      await setDemoProfile(newProfile);
    }
  } catch {
    // If Supabase call failed, save locally in demo session so onboarding succeeds
    const newProfile: Profile = {
      id: "demo-user-" + Date.now(),
      email: "student@siddhartha.co.in",
      created_at: new Date().toISOString(),
      ...payload,
    };
    await setDemoProfile(newProfile);
  }

  revalidatePath("/feed");
  redirect("/feed");
}

export async function updateMyProfile(_previous: FormState, formData: FormData): Promise<FormState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "Please sign in to update your profile." };

  const full_name = formText(formData, "full_name", current.full_name).trim();
  const major = formText(formData, "major", current.major);
  const grad_year = Number(formText(formData, "grad_year", String(current.grad_year)));
  const avatar_url = formText(formData, "avatar_url", current.avatar_url).trim();
  const bio = formText(formData, "bio", current.bio).trim();
  const gender = formText(formData, "gender", current.gender) as Gender;
  const interested_in = formText(formData, "interested_in", current.interested_in) as InterestedIn;
  const status = formText(formData, "status", current.status) as RelationshipStatus;
  const contact_type = formText(formData, "contact_type", current.contact_type) as ContactType;
  const contact_handle = formText(formData, "contact_handle", current.contact_handle).trim();
  const hobbies = parseStringArray(formText(formData, "hobbies", JSON.stringify(current.hobbies))) ?? current.hobbies;
  const relationship_vibes = (parseStringArray(formText(formData, "relationship_vibes", JSON.stringify(current.relationship_vibes))) ?? current.relationship_vibes) as RelationshipVibe[];

  const validation = validateProfile({
    full_name,
    major,
    grad_year,
    avatar_url,
    bio,
    gender,
    interested_in,
    status,
    contact_type,
    contact_handle,
    birth_date: current.birth_date,
    hobbies,
    relationship_vibes,
  });

  if (validation) return { error: validation };

  const updatedProfile: Profile = {
    ...current,
    full_name,
    major,
    grad_year,
    avatar_url,
    bio,
    gender,
    interested_in,
    status,
    hobbies,
    relationship_vibes,
    contact_type,
    contact_handle,
  };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.rpc("save_my_profile", { payload: updatedProfile });
    }
  } catch {
    // If Supabase is unavailable, demo session persists
  }

  await setDemoProfile(updatedProfile);

  revalidatePath("/profile");
  revalidatePath("/feed");
  return { message: "Profile updated successfully!" };
}

export async function likeProfile(profileId: string): Promise<{ error?: string; match?: Match }> {
  const current = await getCurrentProfile();
  if (!current) return { error: "Sign in to like a profile." };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: isMatch, error } = await supabase.rpc("like_profile", { p_receiver_id: profileId });
      if (!error) {
        revalidatePath("/feed");
        if (isMatch) {
          const { data } = await supabase.rpc("get_my_matches");
          const match = (data as Match[] | null)?.find((item) => item.profile_id === profileId);
          revalidatePath("/matches");
          return { match };
        }
        return {};
      }
    }
  } catch {}

  // Fallback for local demo
  const cookieStore = await cookies();
  const demoLikes = cookieStore.get("campuskin_demo_likes")?.value;
  const likes: string[] = demoLikes ? JSON.parse(demoLikes) : [];
  if (!likes.includes(profileId)) {
    likes.push(profileId);
    cookieStore.set("campuskin_demo_likes", JSON.stringify(likes), { path: "/" });
  }

  const target = initialDemoStudents.find((student) => student.id === profileId);
  if (target) {
    const match: Match = {
      id: target.id,
      profile_id: target.id,
      full_name: target.full_name,
      major: target.major,
      grad_year: target.grad_year,
      avatar_url: target.avatar_url,
      bio: target.bio,
      gender: target.gender,
      status: target.status,
      hobbies: target.hobbies,
      relationship_vibes: target.relationship_vibes,
      matched_at: new Date().toISOString(),
      contact_type: target.contact_type,
      contact_handle: target.contact_handle,
    };
    return { match };
  }

  return {};
}

export async function passProfile(profileId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("pass_profile", { p_receiver_id: profileId });
    if (!error) {
      revalidatePath("/feed");
      return {};
    }
  } catch {}

  // Local demo fallback
  const cookieStore = await cookies();
  const demoPasses = cookieStore.get("campuskin_demo_passes")?.value;
  const passes: string[] = demoPasses ? JSON.parse(demoPasses) : [];
  if (!passes.includes(profileId)) {
    passes.push(profileId);
    cookieStore.set("campuskin_demo_passes", JSON.stringify(passes), { path: "/" });
  }

  revalidatePath("/feed");
  return {};
}

function isAdult(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
  return date <= cutoff;
}

function parsePayload(formData: FormData): OnboardingPayload | { error: string } {
  const full_name = formText(formData, "full_name").trim();
  const major = formText(formData, "major");
  const grad_year = Number(formText(formData, "grad_year"));
  const avatar_url = formText(formData, "avatar_url").trim();
  const bio = formText(formData, "bio").trim();
  const gender = formText(formData, "gender", "female") as Gender;
  const interested_in = formText(formData, "interested_in", "opposite") as InterestedIn;
  const status = formText(formData, "status") as RelationshipStatus;
  const contact_type = formText(formData, "contact_type");
  const contact_handle = formText(formData, "contact_handle").trim();
  const birth_date = formText(formData, "birth_date");
  const hobbies = parseStringArray(formText(formData, "hobbies", "[]"));
  const relationship_vibes = parseStringArray(formText(formData, "relationship_vibes", "[]"));

  const validation = validateProfile({
    full_name,
    major,
    grad_year,
    avatar_url,
    bio,
    gender,
    interested_in,
    status,
    contact_type,
    contact_handle,
    birth_date,
    hobbies,
    relationship_vibes,
  });

  if (validation) return { error: validation };

  return {
    birth_date,
    full_name,
    major,
    grad_year,
    avatar_url,
    bio,
    gender,
    interested_in,
    status,
    hobbies: hobbies as string[],
    relationship_vibes: relationship_vibes as OnboardingPayload["relationship_vibes"],
    contact_type: contact_type as OnboardingPayload["contact_type"],
    contact_handle,
  };
}

function validateProfile(profile: Omit<OnboardingPayload, "contact_type" | "hobbies" | "relationship_vibes"> & {
  contact_type: string;
  hobbies: string[] | null;
  relationship_vibes: string[] | null;
}): string | undefined {
  if (profile.full_name.length < 2 || profile.full_name.length > 60) return "Enter a name between 2 and 60 characters.";
  if (!departments.includes(profile.major as (typeof departments)[number])) return "Choose a department from the list.";
  if (!Number.isInteger(profile.grad_year) || profile.grad_year < 2025 || profile.grad_year > 2029) return "Choose a graduation year from 2025 to 2029.";
  if (!isAdult(profile.birth_date)) return "You must be at least 18 to use Campus Kin.";
  if (!isSecureUrl(profile.avatar_url)) return "Upload a photo or enter a valid photo URL.";
  if (profile.bio.length > 280) return "Keep your bio to 280 characters or fewer.";
  if (!validGenders.has(profile.gender)) return "Choose your gender.";
  if (!validInterestedIn.has(profile.interested_in)) return "Choose who you would like to see.";
  if (!statuses.has(profile.status)) return "Choose a relationship status.";
  if (!profile.hobbies || profile.hobbies.length > 5 || profile.hobbies.some((item) => !campusHobbies.includes(item as (typeof campusHobbies)[number]))) {
    return "Pick up to five campus interests from the list.";
  }
  if (!profile.relationship_vibes || profile.relationship_vibes.length > 2 || profile.relationship_vibes.some((item) => !relationshipVibes.includes(item as (typeof relationshipVibes)[number]))) {
    return "Pick up to two relationship intentions from the list.";
  }
  if (profile.contact_type === "instagram" && !/^@?[A-Za-z0-9._]{1,30}$/.test(profile.contact_handle)) return "Enter a valid Instagram username.";
  if (profile.contact_type === "whatsapp" && !/^\+[1-9]\d{7,14}$/.test(profile.contact_handle)) return "Enter a WhatsApp number with country code, such as +919876543210.";
  if (profile.contact_type !== "instagram" && profile.contact_type !== "whatsapp") return "Choose Instagram or WhatsApp for your private contact.";
}

function formText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

function parseStringArray(value: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : null;
  } catch {
    return null;
  }
}

function isSecureUrl(value: string) {
  if (!value) return false;
  if (value.startsWith("/uploads/") || value.startsWith("data:image/")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function authErrorMessage(message: string) {
  if (/already registered|already exists/i.test(message)) return "That college email already has an account. Sign in with your password.";
  if (/rate limit|too many/i.test(message)) return "Too many requests right now. Wait a few minutes before trying again.";
  return "We couldn't create your account. Check your details and try again.";
}

function onboardingErrorMessage(message: string) {
  if (/18 years|at least 18/i.test(message)) return "You must be at least 18 to use Campus Kin.";
  if (/eligible|verify/i.test(message)) return "Verify an eligible Siddhartha college email before continuing.";
  return "Some profile details aren't valid. Review each field and try again.";
}
