import { useState, type FormEvent } from "react";
import { useSignUp } from "@clerk/react/legacy";
import { SocialAuthButtons } from "@/auth/clerk";

interface Props {
  title?: string;
  subtitle?: string;
}

function clerkErrorMessage(err: unknown): string | null {
  if (err && typeof err === "object" && "errors" in err) {
    const arr = (
      err as {
        errors?: Array<{ longMessage?: string; message?: string }>;
      }
    ).errors;
    if (arr && arr[0]) return arr[0].longMessage || arr[0].message || null;
  }
  return null;
}

export function StartPassportForm({
  title = "Start Your Passport",
  subtitle = "Free, takes 10 seconds. Use it across Atlanta.",
}: Props) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    if (!acceptTerms || !acceptPrivacy) {
      setError(
        "Please accept the Terms of Service and Privacy Policy to create your passport.",
      );
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: {
          firstName: firstName.trim(),
          phone: phone.trim() || undefined,
          acceptTerms,
          acceptPrivacy,
          marketingOptIn,
        },
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setCode("");
      setNotice(null);
      setStep("verify");
    } catch (err) {
      setError(
        clerkErrorMessage(err) ??
          "Could not create your account. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    // Email codes are numeric — strip whitespace that autofill/paste often
    // inserts (e.g. "123 456") so a valid code isn't wrongly rejected and the
    // user burns their limited attempts.
    const cleanedCode = code.replace(/\s+/g, "");
    if (cleanedCode.length === 0) {
      setError("Enter the 6-digit code we emailed you.");
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const res = await signUp.attemptEmailAddressVerification({
        code: cleanedCode,
      });
      // A "complete" status means the code was accepted and the account exists.
      // Activate the created session — never tell the user to re-enter an
      // already-consumed code, which only leads to "too many attempts".
      if (res.status === "complete") {
        const sessionId = res.createdSessionId ?? signUp.createdSessionId;
        if (sessionId) {
          // ClerkVisitorBridge then links/creates the passport visitor and the
          // page swaps to the profile view.
          await setActive({ session: sessionId });
          return;
        }
        setError(
          "Your account was verified but we couldn't sign you in. Please refresh and sign in.",
        );
        return;
      }
      setError("Verification incomplete. Please check the code and retry.");
    } catch (err) {
      setError(
        clerkErrorMessage(err) ?? "That code didn't work. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    if (!isLoaded || !signUp || busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      // A fresh code resets Clerk's per-code attempt counter — clear the old
      // entry so the user doesn't resubmit a stale code.
      setCode("");
      setNotice("New code sent — check your email.");
    } catch (err) {
      setError(
        clerkErrorMessage(err) ??
          "Could not resend the code. Please wait a moment and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full border-2 border-foreground rounded-lg px-3 py-2 bg-white";
  const labelClass = "block text-xs font-black uppercase tracking-wider mb-1";

  return (
    <div className="card-pop bg-white p-6 sm:p-8 max-w-md mx-auto">
      <h2
        className="text-2xl font-black mb-1"
        style={{ fontFamily: "Bungee, sans-serif" }}
      >
        {step === "form" ? title : "Check your email"}
      </h2>
      <p className="text-sm text-foreground/70 mb-5">
        {step === "form"
          ? subtitle
          : `We sent a 6-digit code to ${email}. Enter it below to finish.`}
      </p>

      {step === "form" ? (
        <form onSubmit={submitForm} className="space-y-3">
          <div>
            <label className={labelClass}>First name</label>
            <input
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              placeholder="Alex"
            />
          </div>
          <fieldset className="space-y-2 rounded-lg border-2 border-foreground/20 bg-brand-cream/50 p-3">
            <legend className="px-1 text-xs font-black uppercase tracking-wider">
              Agreements
            </legend>
            <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--brand-navy))]"
              />
              <span>
                I accept the{" "}
                <a
                  href="/terms-of-service"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline"
                >
                  Terms of Service
                </a>
                . <span aria-hidden="true">*</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--brand-navy))]"
              />
              <span>
                I acknowledge the{" "}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline"
                >
                  Privacy Policy
                </a>
                . <span aria-hidden="true">*</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--brand-navy))]"
              />
              <span>
                Send me Passport ATL newsletters, rewards, and promotions.
                Optional; you can change this anytime.
              </span>
            </label>
          </fieldset>
          <div>
            <label className={labelClass}>Email</label>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="alex@example.com"
            />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className={labelClass}>
              Phone{" "}
              <span className="opacity-60 font-normal normal-case">
                (optional)
              </span>
            </label>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="(404) 555-0123"
            />
          </div>
          {/* Clerk bot-protection target (required by some instances). */}
          <div id="clerk-captcha" />
          {error && (
            <div className="text-sm text-[hsl(var(--brand-red))] font-bold">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy || !isLoaded}
            className="button-pop button-pop-yellow w-full disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create my passport"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-3">
          <div>
            <label className={labelClass}>Verification code</label>
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${inputClass} tracking-[0.4em] text-center text-lg font-black`}
              placeholder="000000"
            />
          </div>
          {error && (
            <div className="text-sm text-[hsl(var(--brand-red))] font-bold">
              {error}
            </div>
          )}
          {notice && !error && (
            <div className="text-sm text-[hsl(var(--brand-navy))] font-bold">
              {notice}
            </div>
          )}
          <button
            type="submit"
            disabled={busy || !isLoaded}
            className="button-pop button-pop-yellow w-full disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify & create passport"}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError(null);
                setCode("");
              }}
              className="font-bold text-foreground/70 hover:underline"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={resendCode}
              disabled={busy}
              className="font-bold text-[hsl(var(--brand-red))] hover:underline disabled:opacity-60"
            >
              Resend code
            </button>
          </div>
        </form>
      )}

      {step === "form" && (
        <>
          <div className="flex items-center gap-3 my-4">
            <span className="h-0.5 flex-1 bg-foreground/15" />
            <span className="text-xs font-black uppercase tracking-wider text-foreground/50">
              or sign up instantly
            </span>
            <span className="h-0.5 flex-1 bg-foreground/15" />
          </div>

          <SocialAuthButtons
            acceptTerms={acceptTerms}
            acceptPrivacy={acceptPrivacy}
            marketingOptIn={marketingOptIn}
          />

          <p className="mt-4 text-center text-sm text-foreground/70">
            Already have a passport?{" "}
            <a
              href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/sign-in`}
              className="font-bold text-[hsl(var(--brand-red))] hover:underline"
            >
              Sign in
            </a>
          </p>
        </>
      )}
    </div>
  );
}
