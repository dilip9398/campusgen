import type { Gender, InterestedIn, RelationshipStatus } from "@/lib/types";

export const departments = ["CSE", "IT", "ECE", "EEE", "Mech", "Civil", "Biotech", "MBA", "MCA"] as const;
export const graduationYears = [2025, 2026, 2027, 2028, 2029] as const;
export const campusHobbies = [
  "Coding",
  "Gym/Fitness",
  "Chai & Maggi",
  "Anime",
  "Photography",
  "Sports",
  "Hackathons",
  "Gaming",
  "Indie Music",
  "Binge Watching",
] as const;
export const avatarPresets = ["Aarav", "Mira", "Kavi", "Nila", "Dilip", "Priya", "Arjun", "Tara"] as const;

export const genderOptions: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Non-binary / Other" },
];

export const genderLabels: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Non-binary",
};

export const interestedInOptions: { value: InterestedIn; label: string }[] = [
  { value: "opposite", label: "Opposite gender" },
  { value: "female", label: "Women" },
  { value: "male", label: "Men" },
  { value: "all", label: "Everyone" },
];

export function getOppositeGender(gender: Gender): Gender | null {
  if (gender === "male") return "female";
  if (gender === "female") return "male";
  return null;
}

export const statusLabels: Record<RelationshipStatus, string> = {
  single: "Single",
  it_is_complicated: "It's complicated",
  open_to_see: "Exploring",
};

export function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f8d8d8,c1e5de,ffdf9e,e3d9fc`;
}

export function formatAvatarUrl(url?: string, fallbackSeed = "Campus Kin"): string {
  if (!url || !url.trim()) return avatarUrl(fallbackSeed);
  const trimmed = url.trim();

  // If it's a base64 data URL, return as-is for instant local rendering
  if (trimmed.startsWith("data:image/")) return trimmed;

  // If it contains /uploads/, always extract relative path /uploads/... so it works across localhost, mobile IPs, and production
  const uploadIndex = trimmed.indexOf("/uploads/");
  if (uploadIndex !== -1) {
    return trimmed.slice(uploadIndex);
  }

  return trimmed;
}

