import { redirect } from "next/navigation";
import { AuthWizard } from "@/app/auth/AuthWizard";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AuthPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  let initialPhase: 1 | 2 = 1;
  let birthDate = "";

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        initialPhase = 2;
        const { data: profile } = await supabase.rpc("get_my_profile");
        if (profile) redirect("/feed");
        const metadataBirthDate = user.user_metadata?.birth_date;
        if (typeof metadataBirthDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(metadataBirthDate)) {
          birthDate = metadataBirthDate;
        }
      }
    } catch {
      initialPhase = 1;
    }
  }

  return <AuthWizard initialPhase={initialPhase} initialBirthDate={birthDate} verificationError={params.error === "verification"} />;
}
