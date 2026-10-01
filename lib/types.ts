export const relationshipVibes = [
  "Cuffing Season",
  "Long Term / Serious",
  "Situationship",
  "Benching / Roster Dating",
  "Dating & Outings",
  "Study Buddy & Chill",
  "Live-in / Flatmate Vibe",
  "Friends First / Platonic",
] as const;

export type RelationshipVibe = (typeof relationshipVibes)[number];
export type RelationshipStatus = "single" | "it_is_complicated" | "open_to_see";
export type ContactType = "instagram" | "whatsapp";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  major: string;
  grad_year: number;
  avatar_url: string;
  bio: string;
  status: RelationshipStatus;
  hobbies: string[];
  relationship_vibes: RelationshipVibe[];
  contact_type: ContactType;
  contact_handle: string;
  birth_date: string;
  created_at: string;
}

export type DiscoveryProfile = Pick<
  Profile,
  | "id"
  | "full_name"
  | "major"
  | "grad_year"
  | "avatar_url"
  | "bio"
  | "status"
  | "hobbies"
  | "relationship_vibes"
>;

export interface Match extends DiscoveryProfile {
  profile_id: string;
  matched_at: string;
  contact_type: ContactType;
  contact_handle: string;
}

export interface Like {
  id: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
}

export interface OnboardingPayload {
  birth_date: string;
  full_name: string;
  major: string;
  grad_year: number;
  avatar_url: string;
  bio: string;
  status: RelationshipStatus;
  hobbies: string[];
  relationship_vibes: RelationshipVibe[];
  contact_type: ContactType;
  contact_handle: string;
}
