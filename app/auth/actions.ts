"use server";

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
import { getCurrentProfile } from "@/lib/auth-session";

export interface FormState {
  error?: string;
  message?: string;
  email?: string;
  needsOnboarding?: boolean;
}

async function normalizeAvatarUrl(rawUrl: string, nameFallback: string): Promise<string> {
  let url = (rawUrl || "").trim();
  if (url.startsWith("data:image/")) {
    try {
      const matches = url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
        const filename = `${crypto.randomUUID()}.${ext}`;
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.writeFile(path.join(uploadsDir, filename), buffer);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        url = `${appUrl}/uploads/${filename}`;
      }
    } catch (e) {
      console.warn("Failed to write data URI to disk:", e);
    }
  } else if (url.startsWith("/uploads/")) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    url = `${appUrl}${url}`;
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(nameFallback || "Campus Kin")}`;
  }

  return url;
}

const eligibleEmail = /^[^\s@]+@([a-z0-9-]+\.)*siddhartha\.co\.in$/i;
const statuses = new Set<RelationshipStatus>(["single", "it_is_complicated", "open_to_see"]);
const validGenders = new Set<Gender>(["male", "female", "other"]);
const validInterestedIn = new Set<InterestedIn>(["opposite", "female", "male", "all"]);

export async function signUpWithPassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = formText(formData, "email").trim().toLowerCase();
  const password = formText(formData, "password");
  const confirmation = formText(formData, "confirm_password");
  const birthDate = formText(formData, "birth_date");
  const full_name = formText(formData, "full_name").trim();
  const major = formText(formData, "major", "CSE");
  const grad_year = Number(formText(formData, "grad_year", "2026"));
  const gender = formText(formData, "gender", "female") as Gender;

  if (!eligibleEmail.test(email)) {
    return { error: "Only valid Siddhartha college IDs (@siddhartha.co.in) are eligible." };
  }
  if (password.length < 8 || password.length > 128) {
    return { error: "Use a password of at least 8 characters." };
  }
  if (password !== confirmation) {
    return { error: "Your passwords don't match." };
  }
  if (full_name && (full_name.length < 2 || full_name.length > 60)) {
    return { error: "Please enter your full name (2 to 60 characters)." };
  }
  if (birthDate && !isAdult(birthDate)) {
    return { error: "You must be at least 18 to use Campus Kin." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const metadata: Record<string, unknown> = {};
    if (full_name) metadata.full_name = full_name;
    if (birthDate) metadata.birth_date = birthDate;
    if (major) metadata.major = major;
    if (grad_year) metadata.grad_year = grad_year;
    if (gender) metadata.gender = gender;

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (signUpError) {
      if (/already registered|already exists/i.test(signUpError.message)) {
        return { error: "That college email already has an account. Switch to 'Sign in' to log in." };
      }
      return { error: authErrorMessage(signUpError.message) };
    }

    // Sign in immediately to establish user session cookies
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      console.warn("Auto sign-in notice:", signInError.message);
    }
  } catch (err) {
    console.error("SignUp error:", err);
    return { error: "Unable to connect to authentication server. Please check your connection." };
  }

  return { email, message: "Account created successfully!" };
}

export async function signInWithPassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = formText(formData, "email").trim().toLowerCase();
  const password = formText(formData, "password");

  if (!eligibleEmail.test(email)) return { error: "Only valid Siddhartha college IDs (@siddhartha.co.in) are eligible." };
  if (!password) return { error: "Enter your password to sign in." };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (/invalid login credentials|invalid credentials/i.test(error.message)) {
        return { error: "Invalid email or password. If you haven't created an account yet, switch to 'Create account'." };
      }
      if (/email not confirmed/i.test(error.message)) {
        return { error: "Your college email has not been confirmed yet. Please check your inbox for the confirmation link." };
      }
      if (/too many requests|rate limit/i.test(error.message)) {
        return { error: "Too many attempts right now. Please wait a minute before trying again." };
      }
      return { error: error.message || "Incorrect college email or password. Please check your credentials." };
    }
  } catch {
    return { error: "Authentication service is currently unavailable. Please try again." };
  }

  let hasProfile = false;
  try {
    const current = await getCurrentProfile();
    if (current) hasProfile = true;
  } catch {
    hasProfile = false;
  }

  if (hasProfile) {
    redirect("/feed");
  } else {
    return { email, message: "Signed in! Please complete your profile details.", needsOnboarding: true };
  }
}

export async function changePassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const newPassword = formText(formData, "new_password");
  const confirmPassword = formText(formData, "confirm_new_password");

  if (newPassword.length < 8 || newPassword.length > 128) {
    return { error: "New password must be at least 8 characters long." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { error: error.message || "Failed to update password. Please try again." };
    }
    return { message: "Password updated successfully!" };
  } catch {
    return { error: "Unable to update password right now. Please try again." };
  }
}

export async function requestPasswordReset(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = formText(formData, "email").trim().toLowerCase();
  if (!eligibleEmail.test(email)) {
    return { error: "Enter a valid @siddhartha.co.in college email." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/profile`,
    });
    if (error) {
      return { error: error.message || "Could not send reset link. Please try again." };
    }
    return { message: "A password reset link has been sent to your college inbox." };
  } catch {
    return { error: "Unable to process password reset request." };
  }
}

export async function signOut() {
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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Please sign in before completing your profile." };
    }
    if (!eligibleEmail.test(user.email || "")) {
      return { error: "Only valid @siddhartha.co.in college IDs are eligible." };
    }

    // Always normalize avatar to an absolute URL satisfying Supabase's check constraint
    payload.avatar_url = await normalizeAvatarUrl(payload.avatar_url, payload.full_name);

    const { error: rpcError } = await supabase.rpc("save_my_profile", { payload });
    if (rpcError) {
      console.error("save_my_profile RPC failed, trying fallback:", rpcError);
      // Direct upsert fallback
      const { error: directError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: payload.full_name,
        major: payload.major,
        grad_year: payload.grad_year,
        avatar_url: payload.avatar_url,
        bio: payload.bio,
        status: payload.status,
        hobbies: payload.hobbies,
        relationship_vibes: payload.relationship_vibes,
        contact_type: payload.contact_type,
        contact_handle: payload.contact_handle,
        birth_date: payload.birth_date,
      });

      if (directError) {
        console.error("profiles direct upsert failed:", directError);
        return { error: onboardingErrorMessage(rpcError.message || directError.message) };
      }
    }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err && typeof (err as any).digest === "string" && (err as any).digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("completeOnboarding error:", err);
    return { error: "We couldn't save your profile just now. Check your connection and try again." };
  }

  revalidatePath("/feed");
  revalidatePath("/profile");
  redirect("/feed");
}

export async function updateMyProfile(_previous: FormState, formData: FormData): Promise<FormState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "Please sign in to update your profile." };

  const full_name = formText(formData, "full_name", current.full_name).trim();
  const major = formText(formData, "major", current.major);
  const grad_year = Number(formText(formData, "grad_year", String(current.grad_year)));
  const raw_avatar_url = formText(formData, "avatar_url", current.avatar_url).trim();
  const avatar_url = await normalizeAvatarUrl(raw_avatar_url, full_name);
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error: rpcError } = await supabase.rpc("save_my_profile", { payload: updatedProfile });
      if (rpcError) {
        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email,
          full_name,
          major,
          grad_year,
          avatar_url,
          bio,
          status,
          hobbies,
          relationship_vibes,
          contact_type,
          contact_handle,
          birth_date: current.birth_date,
        });
      }
    }
  } catch (err) {
    console.error("Profile update error:", err);
    return { error: "Failed to save profile changes. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/feed");
  return { message: "Profile updated successfully!" };
}

export async function likeProfile(profileId: string): Promise<{ error?: string; match?: Match }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
  if (value.startsWith("/uploads/") || value.startsWith("data:image/") || value.startsWith("http://") || value.startsWith("https://")) return true;
  try {
    const proto = new URL(value).protocol;
    return proto === "https:" || proto === "http:";
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
