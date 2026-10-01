import type { RelationshipStatus } from "@/lib/types";

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
export const avatarPresets = ["Aarav", "Mira", "Kavi", "Nila"] as const;

export const statusLabels: Record<RelationshipStatus, string> = {
  single: "Single",
  it_is_complicated: "It's complicated",
  open_to_see: "Exploring",
};

export function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f8d8d8,c1e5de,ffdf9e,e3d9fc`;
}
