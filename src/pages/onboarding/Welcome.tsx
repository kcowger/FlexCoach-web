import { useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { getApiKey } from '@/lib/dataSync';
import Button from '@/components/ui/Button';

export default function Welcome() {
  const navigate = useNavigate();

  function handleGetStarted() {
    const apiKey = getApiKey();
    if (apiKey) {
      navigate('/onboarding/basics');
    } else {
      navigate('/onboarding/apikey');
    }
  }

  return (
    <div className="bg-background text-text min-h-screen flex flex-col">
      {/* Step indicator */}
      <div className="px-4 pt-6">
        <p className="text-sm text-muted text-center">Step 1 of 7</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Icon */}
          <div className="rounded-full bg-primary/20 p-6">
            <Dumbbell className="h-12 w-12 text-primary" />
          </div>

          {/* Title & tagline */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight">FlexCoach</h1>
            <p className="text-lg text-primary font-medium">
              Your AI-powered triathlon coach
            </p>
          </div>

          {/* Description */}
          <p className="text-muted leading-relaxed max-w-sm">
            FlexCoach creates personalized training plans tailored to your goals,
            schedule, and equipment. Powered by Claude AI, it adapts to your
            progress and keeps you on track for race day.
          </p>

          {/* CTA */}
          <div className="w-full max-w-xs pt-4">
            <Button
              title="Get Started"
              variant="primary"
              size="lg"
              onClick={handleGetStarted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
