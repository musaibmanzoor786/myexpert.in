import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto py-12 px-6 sm:py-20 sm:px-8">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
                </Link>
                <div className="mb-10 pb-6 border-b border-border">
                    <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">About MyExpert</h1>
                    <p className="text-muted-foreground">Connecting customers with trusted local experts.</p>
                </div>
                
                <div className="prose prose-slate max-w-none text-muted-foreground">
                    <p>MyExpert is a simple and reliable platform designed to connect customers with independent service experts in their area. Our goal is to make it easy for people to find trusted professionals and get their work done without hassle.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">A Connection Platform</h2>
                    <p>MyExpert does not provide services itself. We only act as a connection platform where customers and experts can discover each other, communicate, and decide service details independently.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Expert Autonomy</h2>
                    <p>Experts on MyExpert manage their own profiles, availability, pricing, and services. Customers are free to choose experts based on their needs, location, and preferences.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Direct Payments</h2>
                    <p>Currently, MyExpert does not handle payments. All service discussions, pricing, and payments happen directly between the customer and the expert.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Safety & Transparency</h2>
                    <p>We focus on safety, transparency, and simplicity. MyExpert may take action against misuse, fake profiles, or violations to maintain a safe platform for everyone.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Service Area</h2>
                    <p>MyExpert is currently available in selected areas in India and will expand to more cities over time.</p>
                </div>
            </div>
        </main>
    );
}
