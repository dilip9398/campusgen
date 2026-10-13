"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowRight, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { requestPasswordReset, signInWithPassword, signUpWithPassword } from "@/app/auth/actions";
import type { FormState } from "@/app/auth/actions";

type AuthMode = "signup" | "signin";

const input =
  "w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--rose)] focus:ring-2 focus:ring-[var(--rose)]/15";

export function CollegeAuthPanel({
  onAccountCreated,
}: Readonly<{
  initialBirthDate?: string;
  onAccountCreated?: (details: { email: string }) => void;
}>) {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [showForgot, setShowForgot] = useState(false);
  const [signup, signupAction, signupPending] = useActionState(signUpWithPassword, {} as FormState);
  const [signin, signinAction, signinPending] = useActionState(signInWithPassword, {} as FormState);
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordReset, {} as FormState);

  useEffect(() => {
    if (signup.message && !signup.error) {
      onAccountCreated?.({
        email: signup.email ?? "",
      });
    }
  }, [signup.message, signup.error, signup.email, onAccountCreated]);

  useEffect(() => {
    if (signin.needsOnboarding || (signin.message && !signin.error)) {
      onAccountCreated?.({
        email: signin.email ?? "",
      });
    }
  }, [signin.needsOnboarding, signin.message, signin.error, signin.email, onAccountCreated]);

  return (
    <section className="auth-panel">
      <div className="mode-switch" role="tablist" aria-label="Account type">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={mode === "signup" ? "mode-option is-selected" : "mode-option"}
          onClick={() => {
            setMode("signup");
            setShowForgot(false);
          }}
        >
          Create account
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={mode === "signin" ? "mode-option is-selected" : "mode-option"}
          onClick={() => {
            setMode("signin");
            setShowForgot(false);
          }}
        >
          Sign in
        </button>
      </div>

      {showForgot ? (
        <form action={resetAction} className="form-stack">
          <div className="forgot-header">
            <h3>Reset your password</h3>
            <p>Enter your college email to receive a secure reset link.</p>
          </div>
          <label className="form-label" htmlFor="reset-email">
            College email
          </label>
          <input
            id="reset-email"
            className={input}
            type="email"
            name="email"
            placeholder="you@siddhartha.co.in"
            required
          />
          {resetState.error && (
            <p className="form-alert" role="alert">
              {resetState.error}
            </p>
          )}
          {resetState.message && <output className="form-success">{resetState.message}</output>}
          <button
            className="button button-primary button-wide"
            type="submit"
            disabled={resetPending}
          >
            {resetPending ? "Sending link..." : "Send reset link"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="otp-back"
            onClick={() => setShowForgot(false)}
          >
            Back to sign in
          </button>
        </form>
      ) : mode === "signup" ? (
        <form action={signupAction} className="form-stack">
          <div className="step-prompt-header">
            <span className="step-subkicker">STEP 1 OF 4</span>
            <h2 className="step-panel-title">Start with your College ID</h2>
            <p className="step-panel-desc">
              Create your account with your official Siddhartha college email and an 8-character password.
            </p>
          </div>

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
          <p className="field-note">Exclusively for students of Siddhartha Educational Institutions.</p>

          <div className="field-grid">
            <div>
              <label className="form-label" htmlFor="password">
                Password <span className="label-aside">8+ chars</span>
              </label>
              <input
                id="password"
                className={input}
                type="password"
                name="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="confirm-password">
                Confirm password
              </label>
              <input
                id="confirm-password"
                className={input}
                type="password"
                name="confirm_password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Repeat password"
                required
              />
            </div>
          </div>

          {signup.error && (
            <p className="form-alert" role="alert">
              {signup.error}
            </p>
          )}
          {signup.message && <output className="form-success">{signup.message}</output>}

          <button
            className="button button-primary button-wide"
            type="submit"
            disabled={signupPending}
          >
            {signupPending ? "Creating account..." : "Continue to Details"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>

          <p className="auth-footnote">
            <LockKeyhole size={14} aria-hidden="true" /> Your email is kept strictly private and never shown to other students.
          </p>
        </form>
      ) : (
        <form action={signinAction} className="form-stack">
          <div className="step-prompt-header">
            <span className="step-subkicker">WELCOME BACK</span>
            <h2 className="step-panel-title">Sign into Campus Kin</h2>
            <p className="step-panel-desc">
              Sign in with your verified Siddhartha email and password.
            </p>
          </div>

          <label className="form-label" htmlFor="signin-email">
            College email
          </label>
          <input
            id="signin-email"
            className={input}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@siddhartha.co.in"
            required
          />

          <div className="label-row-between">
            <label className="form-label" htmlFor="signin-password">
              Password
            </label>
            <button
              type="button"
              className="text-subtle-btn"
              onClick={() => setShowForgot(true)}
            >
              Forgot password?
            </button>
          </div>
          <input
            id="signin-password"
            className={input}
            type="password"
            name="password"
            minLength={8}
            maxLength={128}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />

          {signin.error && (
            <p className="form-alert" role="alert">
              {signin.error}
            </p>
          )}
          {signin.message && <output className="form-success">{signin.message}</output>}

          <button
            className="button button-primary button-wide"
            type="submit"
            disabled={signinPending}
          >
            {signinPending ? "Signing in..." : "Sign in to Campus"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>

          <p className="auth-footnote">
            <ShieldCheck size={14} aria-hidden="true" /> Siddhartha student accounts only. Email remains private.
          </p>
        </form>
      )}
    </section>
  );
}
