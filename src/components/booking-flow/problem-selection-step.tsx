'use client';

import { useState } from 'react';
import type { ElementType, KeyboardEvent } from "react";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Service } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle } from 'lucide-react';


interface ProblemSelectionStepProps {
  service: Service;
  onNext: (data: Partial<{ problem: string[] }>) => void;
}

export function ProblemSelectionStep({ service, onNext }: ProblemSelectionStepProps) {
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);

  const problems = (service.problems || []) as {
    title: string;
    icon: ElementType;
    isEmergency?: boolean;
    style?: {
        card: string;
        iconWrapper: string;
        icon: string;
    };
  }[];

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, problemTitle: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleProblem(problemTitle);
    }
  };

  const toggleProblem = (problemTitle: string) => {
    setSelectedProblems(prev => 
      prev.includes(problemTitle) 
        ? prev.filter(p => p !== problemTitle) 
        : [...prev, problemTitle]
    );
  };

  const handleContinue = () => {
    if (selectedProblems.length > 0) {
        onNext({ problem: selectedProblems });
    }
  };

  const question = service.problemQuestion || 'What problem are you facing?';

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h2 className="text-xl md:text-2xl font-bold text-center px-4">{question}</h2>
      <div className="grid grid-cols-2 gap-3 px-4">
        {problems.map((problem) => {
          const Icon = problem.icon;
          const isSelected = selectedProblems.includes(problem.title);

          if (!Icon) return null;

          return (
            <Card
              key={problem.title}
              onClick={() => toggleProblem(problem.title)}
              onKeyDown={(e) => handleKeyDown(e, problem.title)}
              role="button"
              tabIndex={0}
              className={cn(
                "relative p-3 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all duration-200 border-2",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                  : "border-transparent bg-secondary hover:shadow-md",
                problem.style?.card
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                    <CheckCircle className="w-3 h-3" />
                </div>
              )}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                isSelected ? 'bg-background' : 'bg-white dark:bg-card-foreground/5',
                problem.style?.iconWrapper
              )}>
                <Icon className={cn(
                    "w-6 h-6", 
                    problem.style?.icon
                        ? problem.style.icon
                        : "text-primary"
                )} />
              </div>
              <p className="font-semibold text-xs leading-tight">{problem.title}</p>
            </Card>
          );
        })}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t md:static md:p-0 md:bg-transparent md:backdrop-blur-none md:border-none">
        <Button 
            size="lg" 
            className="w-full" 
            onClick={handleContinue}
            disabled={selectedProblems.length === 0}
        >
          Find an Expert
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

    </div>
  );
}
