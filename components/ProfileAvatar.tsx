"use client";

import { avatarUrl, formatAvatarUrl } from "@/lib/constants";

interface ProfileAvatarProps {
  url?: string;
  name?: string;
  className?: string;
  size?: number;
}

export function ProfileAvatar({
  url,
  name,
  className = "profile-avatar-img",
  size = 96,
}: ProfileAvatarProps) {
  return (
    <img
      src={formatAvatarUrl(url, name)}
      alt={name ? `${name}'s avatar` : "Profile photo"}
      className={className}
      width={size}
      height={size}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = avatarUrl(name || "Campus Kin");
      }}
    />
  );
}
