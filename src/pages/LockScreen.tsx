import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import Button from '@/components/ui/Button';

export default function LockScreen() {
  const navigate = useNavigate();
  const { hasPassword, setPassword, unlock } = useAuthStore();

  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputClasses =
    'bg-surface text-text border border-surface-light rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary focus:outline-none';

  async function handleSetPassword() {
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await setPassword(password);
      navigate('/profiles');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock() {
    setError('');

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const success = await unlock(password);
      if (success) {
        navigate('/profiles');
      } else {
        setError('Incorrect password.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (hasPassword) {
        handleUnlock();
      } else {
        handleSetPassword();
      }
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
        </div>

        {/* Form */}
        <div className="w-full flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-center text-muted">
            {hasPassword ? 'Enter Password' : 'Create Password'}
          </h2>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            autoFocus
          />

          {!hasPassword && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputClasses}
            />
          )}

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          <Button
            title={hasPassword ? 'Unlock' : 'Set Password'}
            variant="primary"
            size="lg"
            loading={loading}
            onClick={hasPassword ? handleUnlock : handleSetPassword}
          />
        </div>
      </div>
    </div>
  );
}
