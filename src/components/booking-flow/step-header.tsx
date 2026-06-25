
'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft } from 'lucide-react';

interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  serviceName: string;
}

export function StepHeader({ currentStep, totalSteps, onBack, serviceName }: StepHeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg px-2 pt-4 pb-3 border-b">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full h-9 w-9">
                <ChevronLeft className="w-6 h-6" />
            </Button>
            <div>
                <p className="text-xs font-medium text-muted-foreground">Step {currentStep} of {totalSteps}</p>
                <h1 className="text-lg font-bold">{serviceName}</h1>
            </div>
        </div>
        <Progress value={progress} className="mt-4 h-1.5 max-w-4xl mx-auto" />
    </div>
  );
}
