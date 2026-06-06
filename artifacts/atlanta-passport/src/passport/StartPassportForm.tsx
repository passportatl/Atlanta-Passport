import { useState, type FormEvent } from "react";
import { useSignUp } from "@clerk/react/legacy";
import { SocialAuthButtons } from "@/auth/clerk";

interface Props {
  title?: string;
  subtitle?: string;
}

function clerkErrorMessage(err: unknown): string | null {
  if (err && typeof err === "object" && "errors" in err) {
    const arr = (err as {
      errors?: Array<{ longMessage?: string; message?: string }>;
    }).errors;
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
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setError(null);
    setBusy(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: {
          firstName: firstName.trim(),
          phone: phone.trim() || undefined,
        },
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
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
    setError(null);
    setBusy(true);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete" && res.createdSessionId) {
        // Signs the user in. ClerkVisitorBridge then links/creates the
        // passport visitor and the page swaps to the profile view.
        await setActive({ session: res.createdSessionId });
      } else {
        setError("Verification incomplete. Please check the code and retry.");
      }
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
    setBusy(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (err) {
      setError(clerkErrorMessage(err) ?? "Could not resend the code.");
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

          <SocialAuthButtons />

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
