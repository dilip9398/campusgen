"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { campusHobbies, departments } from "@/lib/constants";
import { relationshipVibes, type Match, type OnboardingPayload, type RelationshipStatus } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export interface FormState {
  error?: string;
  message?: string;
  email?: string;
  requiresVerification?: boolean;
}

const eligibleEmail = /^[^\s@]+@siddhartha\.co\.in$/i;
const statuses = new Set<RelationshipStatus>(["single", "it_is_complicated", "open_to_see"]);

export async function sendSignupOtp(_previous: FormState, formData: FormData): Promise<FormState> {
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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=%2Fauth`,
        data: { birth_date: birthDate },
      },
    });
    if (error) return { error: authErrorMessage(error.message) };
    return { email, requiresVerification: true, message: "A verification email is on its way. Open its link, or enter the six-digit code if one is included." };
  } catch {
    return { error: "Authentication is temporarily unavailable. Check the Supabase settings and try again." };
  }
}

export async function verifySignupOtp(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = formText(formData, "email").trim().toLowerCase();
  const token = formText(formData, "token").replace(/\s/g, "");
  if (!eligibleEmail.test(email)) return { error: "Only valid @siddhartha.co.in college IDs are eligible." };
  if (!/^\d{6}$/.test(token)) return { error: "Enter the six-digit code from your college inbox." };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (error) return { error: "That code expired or is incorrect. Request a new code and try again." };
  } catch {
    return { error: "We couldn't verify that code just now. Please try again." };
  }

  redirect("/auth");
}

export async function resendSignupOtp(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = formText(formData, "email").trim().toLowerCase();
  if (!eligibleEmail.test(email)) return { error: "Only valid @siddhartha.co.in college IDs are eligible." };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) return { error: "We couldn't resend the verification email. Wait a minute and try again." };
    return { email, requiresVerification: true, message: "A fresh verification email is on its way." };
  } catch {
    return { error: "Authentication is temporarily unavailable. Please try again." };
  }
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

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_my_profile");
  if (data) redirect("/feed");
  redirect("/auth");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function completeOnboarding(_previous: FormState, formData: FormData): Promise<FormState> {
  const payload = parsePayload(formData);
  if ("error" in payload) return { error: payload.error };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email || !user.email_confirmed_at) {
      return { error: "Verify your college email using the six-digit code we sent before continuing." };
    }
    if (!eligibleEmail.test(user.email)) {
      return { error: "Only valid @siddhartha.co.in college IDs are eligible." };
    }

    const { error } = await supabase.rpc("save_my_profile", { payload });
    if (error) return { error: onboardingErrorMessage(error.message) };
  } catch {
    return { error: "We couldn't save your profile just now. Check your connection and try again." };
  }

  revalidatePath("/feed");
  redirect("/feed");
}

export async function likeProfile(profileId: string): Promise<{ error?: string; match?: Match }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Sign in to like a profile." };

    const { data: isMatch, error } = await supabase.rpc("like_profile", { p_receiver_id: profileId });
    if (error) return { error: "That like couldn't be saved. Please try again." };
    revalidatePath("/feed");

    if (isMatch) {
      const { data } = await supabase.rpc("get_my_matches");
      const match = (data as Match[] | null)?.find((item) => item.profile_id === profileId);
      revalidatePath("/matches");
      return { match };
    }
    return {};
  } catch {
    return { error: "Campus Kin is temporarily unavailable. Please try again." };
  }
}

export async function passProfile(profileId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("pass_profile", { p_receiver_id: profileId });
    if (error) return { error: "That profile couldn't be passed. Please try again." };
    revalidatePath("/feed");
    return {};
  } catch {
    return { error: "Campus Kin is temporarily unavailable. Please try again." };
  }
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
  const status = formText(formData, "status") as RelationshipStatus;
  const contact_type = formText(formData, "contact_type");
  const contact_handle = formText(formData, "contact_handle").trim();
  const birth_date = formText(formData, "birth_date");
  const hobbies = parseStringArray(formText(formData, "hobbies", "[]"));
  const relationship_vibes = parseStringArray(formText(formData, "relationship_vibes", "[]"));
  const validation = validateProfile({ full_name, major, grad_year, avatar_url, bio, status, contact_type, contact_handle, birth_date, hobbies, relationship_vibes });
  if (validation) return { error: validation };

  return {
    birth_date,
    full_name,
    major,
    grad_year,
    avatar_url,
    bio,
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
  if (!isSecureUrl(profile.avatar_url)) return "Enter a valid public https image URL.";
  if (profile.bio.length > 280) return "Keep your bio to 280 characters or fewer.";
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
