"use client";

import { useActionState, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { resendSignupOtp, sendSignupOtp, signInWithPassword, verifySignupOtp } from "@/app/auth/actions";
import type { FormState } from "@/app/auth/actions";

type AuthMode = "signup" | "signin";
type FormAction = (formData: FormData) => void | Promise<void>;

const input = "w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--rose)] focus:ring-2 focus:ring-[var(--rose)]/15";

export function CollegeAuthPanel({ initialBirthDate, verificationError }: Readonly<{
  initialBirthDate: string;
  verificationError: boolean;
}>) {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [signup, signupAction, signupPending] = useActionState(sendSignupOtp, {} as FormState);
  const [signin, signinAction, signinPending] = useActionState(signInWithPassword, {} as FormState);
  const [otp, otpAction, otpPending] = useActionState(verifySignupOtp, {} as FormState);
  const [resend, resendAction, resendPending] = useActionState(resendSignupOtp, {} as FormState);

  return <section className="auth-panel">
    <div className="mode-switch" role="tablist" aria-label="Account type">
      <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "mode-option is-selected" : "mode-option"} onClick={() => setMode("signup")}>Create account</button>
      <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "mode-option is-selected" : "mode-option"} onClick={() => setMode("signin")}>Sign in</button>
    </div>
    {mode === "signup" && signup.requiresOtp
      ? <OtpVerification email={signup.email ?? ""} signupMessage={signup.message} otp={otp} otpAction={otpAction} otpPending={otpPending} resend={resend} resendAction={resendAction} resendPending={resendPending} onBackToSignIn={() => setMode("signin")} />
      : <CredentialsForm mode={mode} action={mode === "signup" ? signupAction : signinAction} state={mode === "signup" ? signup : signin} pending={mode === "signup" ? signupPending : signinPending} initialBirthDate={initialBirthDate} verificationError={verificationError} />}
  </section>;
}

function OtpVerification({ email, signupMessage, otp, otpAction, otpPending, resend, resendAction, resendPending, onBackToSignIn }: Readonly<{
  email: string;
  signupMessage?: string;
  otp: FormState;
  otpAction: FormAction;
  otpPending: boolean;
  resend: FormState;
  resendAction: FormAction;
  resendPending: boolean;
  onBackToSignIn: () => void;
}>) {
  return <div className="form-stack otp-verification">
    <h2>Check your college inbox.</h2>
    <p>Enter the six-digit code sent to <strong>{email}</strong>.</p>
    {signupMessage && <output className="form-success">{signupMessage}</output>}
    <form action={otpAction} className="form-stack">
      <input type="hidden" name="email" value={email} />
      <label className="form-label" htmlFor="signup-otp">Email verification code</label>
      <input id="signup-otp" className={input} name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="000000" required />
      {otp.error && <p className="form-alert" role="alert">{otp.error}</p>}
      <button className="button button-primary button-wide" type="submit" disabled={otpPending}>{otpPending ? "Verifying..." : "Verify code"}<ArrowRight size={17} aria-hidden="true" /></button>
    </form>
    <form action={resendAction}>
      <input type="hidden" name="email" value={email} />
      {resend.error && <p className="form-alert" role="alert">{resend.error}</p>}
      {resend.message && <output className="form-success">{resend.message}</output>}
      <button className="button button-secondary button-wide" type="submit" disabled={resendPending}>{resendPending ? "Sending..." : "Resend code"}</button>
    </form>
    <button className="otp-back" type="button" onClick={onBackToSignIn}>Back to sign in</button>
  </div>;
}

function CredentialsForm({ mode, action, state, pending, initialBirthDate, verificationError }: Readonly<{
  mode: AuthMode;
  action: FormAction;
  state: FormState;
  pending: boolean;
  initialBirthDate: string;
  verificationError: boolean;
}>) {
  const submitLabel = pending ? "Working..." : mode === "signup" ? "Verify my Siddhartha ID" : "Sign in";

  return <form action={action} className="form-stack">
    <label className="form-label" htmlFor="college-email">College email</label>
    <input id="college-email" className={input} type="email" name="email" autoComplete="email" placeholder="you@siddhartha.co.in" required />
    <p className="field-note">Only valid @siddhartha.co.in college IDs are eligible.</p>
    <label className="form-label" htmlFor="password">Password</label>
    <input id="password" className={input} type="password" name="password" minLength={mode === "signup" ? 10 : 1} maxLength={128} autoComplete={mode === "signup" ? "new-password" : "current-password"} required />
    {mode === "signup" && <>
      <label className="form-label" htmlFor="confirm-password">Confirm password</label>
      <input id="confirm-password" className={input} type="password" name="confirm_password" minLength={10} maxLength={128} autoComplete="new-password" required />
      <label className="form-label" htmlFor="birth-date">Date of birth <span className="label-aside">18+ only</span></label>
      <input id="birth-date" className={input} type="date" name="birth_date" max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)} defaultValue={initialBirthDate} required />
    </>}
    {verificationError && <p className="form-alert" role="alert">That verification link expired or could not be used. Request a fresh one.</p>}
    {state.error && <p className="form-alert" role="alert">{state.error}</p>}
    {state.message && <output className="form-success">{state.message}</output>}
    <button className="button button-primary button-wide" type="submit" disabled={pending}>{submitLabel}<ArrowRight size={17} aria-hidden="true" /></button>
    <p className="auth-footnote"><LockKeyhole size={14} aria-hidden="true" /> Your email is verified, never shown on your profile.</p>
  </form>;
}
