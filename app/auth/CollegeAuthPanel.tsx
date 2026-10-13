"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { quickDemoLogin, signInWithPassword, signUpWithPassword } from "@/app/auth/actions";
import type { FormState } from "@/app/auth/actions";

type AuthMode = "signup" | "signin";
type FormAction = (formData: FormData) => void | Promise<void>;

const input =
  "w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--rose)] focus:ring-2 focus:ring-[var(--rose)]/15";
const submitLabels: Record<AuthMode, string> = { signup: "Create account", signin: "Sign in" };

export function CollegeAuthPanel({
  initialBirthDate,
  onAccountCreated,
}: Readonly<{
  initialBirthDate: string;
  onAccountCreated?: (birthDate: string, email: string) => void;
}>) {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [signup, signupAction, signupPending] = useActionState(signUpWithPassword, {} as FormState);
  const [signin, signinAction, signinPending] = useActionState(signInWithPassword, {} as FormState);
  const birthDateRef = useRef("");

  useEffect(() => {
    if (signup.message && !signup.error) {
      onAccountCreated?.(birthDateRef.current, signup.email ?? "");
    }
  }, [signup.message, signup.error, signup.email, onAccountCreated]);

  return (
    <section className="auth-panel">
      <div className="mode-switch" role="tablist" aria-label="Account type">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={mode === "signup" ? "mode-option is-selected" : "mode-option"}
          onClick={() => setMode("signup")}
        >
          Create account
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={mode === "signin" ? "mode-option is-selected" : "mode-option"}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
      </div>

      <CredentialsForm
        mode={mode}
        action={mode === "signup" ? signupAction : signinAction}
        state={mode === "signup" ? signup : signin}
        pending={mode === "signup" ? signupPending : signinPending}
        initialBirthDate={initialBirthDate}
        onBirthDateChange={(val) => {
          birthDateRef.current = val;
        }}
      />
    </section>
  );
}

function CredentialsForm({
  mode,
  action,
  state,
  pending,
  initialBirthDate,
  onBirthDateChange,
}: Readonly<{
  mode: AuthMode;
  action: FormAction;
  state: FormState;
  pending: boolean;
  initialBirthDate: string;
  onBirthDateChange?: (val: string) => void;
}>) {
  const submitLabel = pending ? "Working..." : submitLabels[mode];

  return (
    <form action={action} className="form-stack">
      <label className="form-label" htmlFor="college-email">
        College email
      </label>
      <input
        id="college-email"
        className={input}
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@siddhartha.co.in"
        required
      />
      <p className="field-note">Only valid @siddhartha.co.in college IDs are eligible.</p>

      <label className="form-label" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        className={input}
        type="password"
        name="password"
        minLength={mode === "signup" ? 10 : 1}
        maxLength={128}
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        required
      />

      {mode === "signup" && (
        <>
          <label className="form-label" htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            className={input}
            type="password"
            name="confirm_password"
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
            required
          />

          <label className="form-label" htmlFor="birth-date">
            Date of birth <span className="label-aside">18+ only</span>
          </label>
          <input
            id="birth-date"
            className={input}
            type="date"
            name="birth_date"
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
              .toISOString()
              .slice(0, 10)}
            defaultValue={initialBirthDate}
            onChange={(e) => onBirthDateChange?.(e.target.value)}
            required
          />
        </>
      )}

      {state.error && (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      )}
      {state.message && <output className="form-success">{state.message}</output>}

      <button className="button button-primary button-wide" type="submit" disabled={pending}>
        {submitLabel}
        <ArrowRight size={17} aria-hidden="true" />
      </button>

      <div className="demo-auth-divider">
        <span>OR TEST THE APP</span>
      </div>
      <button formAction={quickDemoLogin} type="submit" className="button button-secondary button-wide">
        <Sparkles size={16} /> Instant Demo Account
      </button>

      <p className="auth-footnote">
        <LockKeyhole size={14} aria-hidden="true" /> Your email is verified, never shown on your
        profile.
      </p>
    </form>
  );
}
