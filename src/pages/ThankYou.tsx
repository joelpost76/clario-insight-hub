import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function ThankYou() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-lg w-full text-center">
        <CardContent className="pt-10 pb-8 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">Request Received!</h1>

          <p className="text-muted-foreground leading-relaxed">
            Thank you for your interest in Clario™ Diagnostic. We'll review your request and reach out within 24–48 hours.
          </p>

          <div className="text-left space-y-3 bg-accent rounded-lg p-6">
            <p className="font-semibold text-foreground text-sm">What happens next:</p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="font-semibold text-primary">1.</span>
                We'll review your request and company profile
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-primary">2.</span>
                If it's a good fit, we'll schedule a 30-minute intro call
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-primary">3.</span>
                After the call, we'll send a formal proposal
              </li>
            </ol>
          </div>

          <Button onClick={() => navigate('/')} variant="outline">
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
