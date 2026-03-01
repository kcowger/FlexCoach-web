import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';
import { STORAGE_KEYS } from '@/storage/keys';
import { createMessage } from '@/services/claude';
import Button from '@/components/ui/Button';

export default function ApiKey() {
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleValidate() {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('Please enter your API key.');
      return;
    }

    setError('');
    setLoading(true);

    // Save key first so createMessage can read it
    localStorage.setItem(STORAGE_KEYS.CLAUDE_API_KEY, trimmed);

    try {
      await createMessage(
        'You are a helpful assistant.',
        [{ role: 'user', content: 'Say "ok" and nothing else.' }],
        16
      );
      navigate('/onboarding/goals');
    } catch (err) {
      // Remove invalid key
      localStorage.removeItem(STORAGE_KEYS.CLAUDE_API_KEY);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to validate API key. Please check and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleValidate();
    }
  }

  return (
    <div className="bg-background text-text min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 pt-6">
        <button
          onClick={() => navigate('/onboarding/welcome')}
          className="cursor-pointer rounded-xl bg-surface p-2.5 text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-sm text-muted text-center flex-1 pr-10">Step 2 of 6</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto px-4 py-8 w-full">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="rounded-full bg-primary/20 p-4">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Connect to Claude AI</h1>
          <p className="text-muted text-center leading-relaxed">
            FlexCoach uses Claude AI to generate personalized training plans and
            provide coaching advice. Your API key is stored only in your browser.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* API Key input */}
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-surface text-text border border-surface-light rounded-xl px-4 py-3 w-full pr-12 focus:ring-2 focus:ring-primary focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
            >
              {showKey ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          {/* Validate button */}
          <Button
            title="Validate & Continue"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!apiKey.trim()}
            onClick={handleValidate}
          />

          {/* Link */}
          <p className="text-sm text-muted text-center">
            Get an API key at{' '}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              console.anthropic.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
