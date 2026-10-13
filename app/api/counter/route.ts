import { NextResponse } from "next/server";
import { getCampusSignupCount } from "@/lib/auth-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const count = await getCampusSignupCount();
    const goal = 50;
    const isUnlocked = count >= goal;
    const remaining = Math.max(0, goal - count);
    const percent = Math.min(100, Math.max(4, Math.round((count / goal) * 100)));

    return NextResponse.json(
      {
        count,
        goal,
        isUnlocked,
        remaining,
        percent,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { count: 1, goal: 50, isUnlocked: false, remaining: 49, percent: 4 },
      { status: 200 }
    );
  }
}
