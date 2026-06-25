'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { servicesList } from '@/lib/constants';

import { StepHeader } from '@/components/booking-flow/step-header';
import { ProblemSelectionStep } from '@/components/booking-flow/problem-selection-step';

interface BookingData {
    problem: string[];
}

export default function BookServicePage() {
    const router = useRouter();
    const params = useParams();
    const serviceName = decodeURIComponent(params.service as string);

    const service = useMemo(() => servicesList.find(s => s.name.toLowerCase() === serviceName), [serviceName]);

    const handleNext = (newData: Partial<BookingData>) => {
        const problems = Array.isArray(newData.problem) ? newData.problem : [];
        const queryParams = new URLSearchParams({
            service: serviceName,
            problem: problems.join(','),
        });
        
        router.push(`/search?${queryParams.toString()}`);
    };

    const handlePrev = () => {
        window.history.length > 2 ? router.back() : router.push('/');
    };

    if (!service) {
        return (
            <div className="text-center py-20">
                <p>Service not found.</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <StepHeader
                currentStep={1}
                totalSteps={1}
                onBack={handlePrev}
                serviceName={service.name}
            />
            <div className="mt-8">
                <ProblemSelectionStep service={service} onNext={handleNext} />
            </div>
        </div>
    );
}
