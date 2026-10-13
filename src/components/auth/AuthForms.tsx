'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Lock, Mail, User, AtSign, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/layout/Navigation';
import { api } from '@/lib/client';

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-community-50 via-white to-marketplace-50">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 text-center mt-1">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="text-center text-sm text-gray-600 mt-5">{footer}</div>}
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail; label: string }) {
  return (
    <div>
      <label htmlFor={props.id} className="label">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input {...props} className="input-field pl-9 py-2.5" />
      </div>
    </div>
  );
}

function GoogleButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <>
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.9S6.8 21.4 12 21.4c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12z" />
        </svg>
        Continue with Google
      </button>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400">or with email</span>
        </div>
      </div>
    </>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  AccountSuspended: 'This account has been suspended for violating the Community Guidelines.',
  OAuthAccountNotLinked: 'This email is already registered. Sign in with your password instead.',
  CredentialsSignin: 'Incorrect email or password.',
};

export function SignInForm({ googleEnabled, callbackUrl, initialError }: { googleEnabled: boolean; callbackUrl: string; initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ? ERROR_MESSAGES[initialError] ?? 'Sign in failed. Please try again.' : '');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (!result || result.error) {
      setError(ERROR_MESSAGES[result?.error ?? ''] ?? ERROR_MESSAGES.CredentialsSignin);
      return;
    }
    router.replace(callbackUrl);
    router.refresh();
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to connect with your neighborhood"
      footer={
        <>
          New to LocalVibe?{' '}
          <Link href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-community-600 hover:text-community-700">
            Create an account
          </Link>
        </>
      }
    >
      {googleEnabled && <GoogleButton callbackUrl={callbackUrl} />}
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Field id="email" icon={Mail} label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field id="password" icon={Lock} label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex justify-end -mt-1">
          <Link href="/auth/forgot-password" className="text-sm text-community-600 hover:text-community-700">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full py-2.5">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}

export function SignUpForm({ googleEnabled, callbackUrl }: { googleEnabled: boolean; callbackUrl: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: key === 'username' ? event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') : event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api('/api/auth/register', { body: { ...form, acceptTerms } });
      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (result?.error) throw new Error('Account created. Please sign in.');
      toast.success('Welcome to LocalVibe!');
      router.replace(callbackUrl === '/feed' ? '/feed?welcome=1' : callbackUrl);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Join your neighborhood"
      subtitle="Free forever. Takes 30 seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-community-600 hover:text-community-700">
            Sign in
          </Link>
        </>
      }
    >
      {googleEnabled && <GoogleButton callbackUrl={callbackUrl} />}
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Field id="name" icon={User} label="Full name" autoComplete="name" required minLength={2} maxLength={60} value={form.name} onChange={update('name')} />
        <Field id="username" icon={AtSign} label="Username" autoComplete="username" required minLength={3} maxLength={20} value={form.username} onChange={update('username')} placeholder="letters, numbers, _" />
        <Field id="email" icon={Mail} label="Email" type="email" autoComplete="email" required value={form.email} onChange={update('email')} />
        <Field id="password" icon={Lock} label="Password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={update('password')} placeholder="At least 8 characters" />
        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 rounded border-gray-300 text-community-600 focus:ring-community-500" required />
          <span>
            I agree to the{' '}
            <Link href="/terms" target="_blank" className="text-community-600 underline">Terms</Link>,{' '}
            <Link href="/privacy" target="_blank" className="text-community-600 underline">Privacy Policy</Link> and{' '}
            <Link href="/guidelines" target="_blank" className="text-community-600 underline">Community Guidelines</Link>.
          </span>
        </label>
        <Button type="submit" loading={loading} disabled={!acceptTerms} className="w-full py-2.5">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api('/api/auth/forgot-password', { body: { email } });
      setSent(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one"
      footer={<Link href="/auth/signin" className="font-semibold text-community-600">Back to sign in</Link>}
    >
      {sent ? (
        <div className="text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-marketplace-500 mx-auto" />
          <p className="text-sm text-gray-600">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires in 1 hour. Check your spam folder too.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field id="email" icon={Mail} label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={loading} className="w-full py-2.5">
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(token ? '' : 'This reset link is missing its token. Please request a new one.');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api('/api/auth/reset-password', { body: { token, password } });
      toast.success('Password updated. Please sign in.');
      router.replace('/auth/signin');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Choose a new password" footer={<Link href="/auth/forgot-password" className="font-semibold text-community-600">Request a new link</Link>}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Field id="password" icon={Lock} label="New password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field id="confirm" icon={Lock} label="Confirm password" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" loading={loading} disabled={!token} className="w-full py-2.5">
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}
