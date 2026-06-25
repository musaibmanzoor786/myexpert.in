import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RefundPolicyPage() {
    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto py-12 px-6 sm:py-20 sm:px-8">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
                </Link>
                <div className="mb-10 pb-6 border-b border-border">
                    <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">Refund Policy</h1>
                    <p className="text-muted-foreground">Last updated: July 29, 2024</p>
                </div>
                
                <div className="prose prose-slate max-w-none text-muted-foreground">
                    <p>Our platform connects you with independent experts. This policy outlines the refund process, which is managed directly between customers and experts.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">1. MyExpert is a Platform</h2>
                    <p>MyExpert is a neutral marketplace that connects customers with service professionals. We do not provide the services ourselves and are not involved in the execution, quality, or pricing of the work performed.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">2. Direct Payment & Refunds</h2>
                    <p>All payments for services are made directly from the customer to the expert. Consequently, MyExpert does not handle, process, or hold any funds related to bookings.</p>
                    <p>Because we do not manage payments, <strong>MyExpert does not issue refunds.</strong> All refund requests must be handled directly between the customer and the expert they booked.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">3. Resolving Issues with Your Expert</h2>
                    <p>We encourage open communication to resolve any issues. If you are unsatisfied with a service, please take the following steps:</p>
                    <ul className="list-disc pl-6 space-y-2 my-4">
                        <li>Contact the expert immediately to discuss your concerns.</li>
                        <li>Clearly explain the issue and provide any relevant photos or details.</li>
                        <li>Attempt to reach a mutual agreement, which may include a partial or full refund, or having the expert correct the work.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">4. Dispute Resolution</h2>
                    <p>Customers and experts are responsible for resolving their own disputes. MyExpert does not mediate payment or refund disagreements.</p>
                    <p>We recommend that both parties agree on the scope of work, cost, and payment terms in writing (even via text message) before the job begins to prevent misunderstandings.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">5. Platform Integrity</h2>
                    <p>While we do not handle refunds, we take platform integrity seriously. If you believe an expert has acted fraudulently or unprofessionally, please report their profile to us. We will investigate and take appropriate action, which may include suspending or removing the expert from the platform.</p>
                </div>
            </div>
        </main>
    );
}
