import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import Button from '@/components/ui/Button';

export default function LockScreen() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputClasses =
    'bg-surface text-text border border-surface-light rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary focus:outline-none';

  async function handleLogin() {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/profiles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }

  return (
    <div className="bg-background text-text min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-surface p-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FlexCoach</h1>
          <p className="text-sm text-muted">Sign in to continue</p>
        </div>

        {/* Form */}
        <div className="w-full flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            autoFocus
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className={inputClasses}
          />

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          <Button
            title="Sign In"
            variant="primary"
            size="lg"
            loading={loading}
            onClick={handleLogin}
          />
        </div>
      </div>
    </div>
  );
}
