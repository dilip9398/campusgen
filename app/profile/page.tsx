import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { EditProfileForm } from "@/app/profile/EditProfileForm";
import { getCurrentProfile } from "@/lib/auth-session";
import { avatarUrl, formatAvatarUrl, statusLabels } from "@/lib/constants";
import { GraduationCap, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth");

  return (
    <>
      <Navbar signedIn />
      <main className="app-frame profile-page">
        {/* Profile Header Hero */}
        <div className="profile-hero-card">
          <div className="profile-hero-banner" />
          <div className="profile-hero-content">
            <div className="profile-avatar-wrapper">
              <img
                src={formatAvatarUrl(profile.avatar_url, profile.full_name)}
                alt={`${profile.full_name}'s avatar`}
                className="profile-avatar-img"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = avatarUrl(profile.full_name || "Campus Kin");
                }}
              />
            </div>
            <div className="profile-hero-info">
              <div className="profile-hero-badges">
                <span className="status-pill">{statusLabels[profile.status] || "Single"}</span>
                <span className="gender-pill">
                  {profile.gender === "female" ? "♀ Woman" : profile.gender === "male" ? "♂ Man" : "Non-binary"}
                </span>
                <span className="campus-pill">
                  <GraduationCap size={13} /> {profile.major} · {profile.grad_year}
                </span>
              </div>
              <h1>{profile.full_name}</h1>
              <div className="profile-hero-verified">
                <ShieldCheck size={14} />
                <span>Verified Siddhartha Student</span>
                <span className="privacy-pill">Private Account</span>
              </div>
              {profile.bio && <p className="profile-hero-bio">&ldquo;{profile.bio}&rdquo;</p>}
            </div>
          </div>
        </div>

        {/* Profile Edit & Hobby/Status Management */}
        <EditProfileForm profile={profile} />
      </main>
    </>
  );
}
