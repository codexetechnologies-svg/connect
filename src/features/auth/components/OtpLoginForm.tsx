'use client';

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand-logo';
import { LanguageToggle } from '@/components/language-toggle';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/features/i18n/language-provider';
import { sendOtpAction } from '@/features/auth/actions/send-otp.action';
import { verifyOtpAction } from '@/features/auth/actions/verify-otp.action';

const codeLength = 6;

export function OtpLoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(Array(codeLength).fill(''));
  const [codeRequested, setCodeRequested] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function requestCode() {
    setErrorMessage('');
    setErrorDetails('');
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      const result = await sendOtpAction({ email });
      if (!result.ok) {
        setErrorMessage(t(result.error));
        setErrorDetails(result.details ?? '');
        if (result.retryAfterSeconds) setCooldown(result.retryAfterSeconds);
        return;
      }

      setCodeRequested(true);
      setCode(Array(codeLength).fill(''));
      setCooldown(result.cooldownSeconds);
      setStatusMessage(t(result.message));
      window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
    } catch {
      setErrorMessage(t('Could not reach the sign-in service. Please try again.'));
      setErrorDetails('');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestCode();
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setErrorDetails('');
    setIsSubmitting(true);

    try {
      const result = await verifyOtpAction({ email, code: code.join('') });
      if (!result.ok) {
        setErrorMessage(t(result.error));
        return;
      }
      router.replace(result.redirect);
      router.refresh();
    } catch {
      setErrorMessage(t('Could not reach the sign-in service. Please try again.'));
      setErrorDetails('');
    } finally {
      setIsSubmitting(false);
    }
  }

  function fillCode(startIndex: number, value: string) {
    const digits = value.replace(/\D/g, '').slice(0, codeLength - startIndex);
    setCode((current) => {
      const next = [...current];
      for (let index = 0; index < digits.length; index += 1) {
        next[startIndex + index] = digits[index];
      }
      return next;
    });
    const focusIndex = Math.min(startIndex + digits.length, codeLength - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  function handleCodeChange(index: number, value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      fillCode(index, digits);
      return;
    }

    setCode((current) => {
      const next = [...current];
      next[index] = digits;
      return next;
    });
    if (digits && index < codeLength - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleCodePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text');
    const digits = pasted.replace(/\D/g, '');
    if (!digits) return;
    event.preventDefault();
    fillCode(index, digits);
  }

  function handleCodeKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function changeEmail() {
    setCode(Array(codeLength).fill(''));
    setCodeRequested(false);
    setCooldown(0);
    setStatusMessage('');
    setErrorMessage('');
    setErrorDetails('');
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-background">
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[710px] rounded-3xl border border-brand-border bg-white p-5 shadow-soft sm:p-8 md:p-10">
          <div className="mb-5 flex justify-end">
            <LanguageToggle />
          </div>
          <div className="mb-5 flex justify-center">
            <BrandLogo size="large" />
          </div>
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-brand-navy">
            {t('Secure sign in')}
          </p>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-[-0.04em] text-brand-navy sm:text-5xl">
            {t('Welcome back')}
          </h1>
          <p className="mb-8 text-sm leading-6 text-slate-600">
            {t('Sign in with the email registered to your approved account.')}
          </p>

          {!codeRequested ? (
            <form className="space-y-5" onSubmit={handleEmailSubmit}>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('Email address')}
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  maxLength={320}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  placeholder="name@example.com"
                  className="form-control h-12 rounded-xl px-4 text-base"
                />
              </div>
              <Button type="submit" disabled={isSubmitting || cooldown > 0} className="h-14 w-full rounded-xl text-lg font-bold">
                {isSubmitting
                  ? t('Please wait…')
                  : cooldown > 0
                    ? t('Resend code in {seconds}s').replace('{seconds}', String(cooldown))
                    : t('Send one-time code')}
              </Button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleCodeSubmit}>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-slate-700">
                  {t('Enter the 6-digit code sent to your email.')}
                </legend>
                <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-label={t('One-time code')}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => { inputRefs.current[index] = element; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      aria-label={`${t('One-time code')} ${index + 1}`}
                      required
                      pattern="[0-9]"
                      maxLength={6}
                      value={digit}
                      disabled={isSubmitting}
                      onChange={(event) => handleCodeChange(index, event.target.value)}
                      onPaste={(event) => handleCodePaste(index, event)}
                      onKeyDown={(event) => handleCodeKeyDown(index, event)}
                      className="form-control h-12 min-w-0 w-1/6 rounded-xl px-1 text-center font-mono text-lg font-bold sm:h-14 sm:text-xl"
                    />
                  ))}
                </div>
              </fieldset>
              <p role="status" className="text-sm text-slate-600">
                {statusMessage}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={changeEmail}
                  disabled={isSubmitting}
                  className="font-medium text-brand-navy underline underline-offset-4"
                >
                  {t('Change email')}
                </button>
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={isSubmitting || cooldown > 0}
                  className="font-medium text-brand-navy underline underline-offset-4 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {cooldown > 0
                    ? t('Resend code in {seconds}s').replace('{seconds}', String(cooldown))
                    : t('Resend code')}
                </button>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || code.join('').length !== codeLength}
                className="h-14 w-full rounded-xl text-lg font-bold"
              >
                {isSubmitting ? t('Please wait…') : t('Verify and sign in')}
              </Button>
            </form>
          )}

          {errorMessage && (
            <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{errorMessage}</p>
              {errorDetails && <p className="mt-2 font-mono text-xs">{errorDetails}</p>}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
