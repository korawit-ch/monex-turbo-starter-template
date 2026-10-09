'use client';

import { useState, type FormEvent } from 'react';

export default function LoginPage() {
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password'),
      }),
    });
    if (!response.ok) {
      setError(
        response.status === 401 ? 'Invalid credentials' : 'Unable to sign in',
      );
      setSubmitting(false);
      return;
    }
    window.location.assign('/');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-8">
      <form
        className="w-full space-y-4"
        onSubmit={(event) => void submit(event)}
      >
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <label className="block">
          <span>Email</span>
          <input
            className="mt-1 w-full border p-2"
            name="email"
            type="email"
            required
          />
        </label>
        <label className="block">
          <span>Password</span>
          <input
            className="mt-1 w-full border p-2"
            name="password"
            type="password"
            minLength={8}
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button
          className="border px-4 py-2"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
