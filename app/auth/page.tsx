import { redirect } from "next/navigation";
import { AuthWizard } from "@/app/auth/AuthWizard";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentProfile } from "@/lib/auth-session";
import type { Gender } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AuthPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const current = await getCurrentProfile();
  if (current) redirect("/feed");

  let initialPhase: 1 | 2 | 3 | 4 = 1;
  let birthDate = "";
  let email = "";
  let fullName = "";
  let major = "CSE";
  let gradYear = 2026;
  let gender: Gender = "female";

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        initialPhase = 2;
        email = user.email || "";
        const metadata = user.user_metadata || {};
        if (typeof metadata.birth_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(metadata.birth_date)) {
          birthDate = metadata.birth_date;
        }
        if (typeof metadata.full_name === "string") {
          fullName = metadata.full_name;
        }
        if (typeof metadata.major === "string") {
          major = metadata.major;
        }
        if (typeof metadata.grad_year === "number") {
          gradYear = metadata.grad_year;
        }
        if (metadata.gender === "male" || metadata.gender === "female" || metadata.gender === "other") {
          gender = metadata.gender;
        }
      }
    } catch {
      initialPhase = 1;
    }
  }

  return (
    <AuthWizard
      initialPhase={initialPhase}
      initialBirthDate={birthDate}
      initialEmail={email}
      initialFullName={fullName}
      initialMajor={major}
      initialGradYear={gradYear}
      initialGender={gender}
    />
  );
}
