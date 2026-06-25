import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto py-12 px-6 sm:py-20 sm:px-8">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
                </Link>
                <div className="mb-10 pb-6 border-b border-border">
                    <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">Terms & Conditions</h1>
                    <p className="text-muted-foreground">Last updated: May 26, 2026</p>
                </div>
                
                <div className="prose prose-slate max-w-none text-muted-foreground">
                    <p>Welcome to MyExpert. By accessing or using our platform, you agree to these Terms & Conditions. MyExpert is a platform to connect customers with independent service experts.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">1. Platform Purpose</h2>
                    <p>MyExpert is a connection platform only. We connect customers with independent experts but do not provide the services ourselves. We are not a party to any agreement between users.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">2. Services & Responsibility</h2>
                    <ul className="list-disc pl-6 space-y-2 my-4">
                        <li>Experts are solely responsible for the services they offer, including quality and safety.</li>
                        <li>Customers and experts are responsible for negotiating and agreeing upon pricing, timing, and payment methods directly.</li>
                        <li>MyExpert is not responsible for service quality, disputes, damages, or any outcomes related to the services provided.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">3. Payments</h2>
                    <p>Currently, MyExpert does not process any payments. All financial transactions are managed directly between the customer and the expert. We are not responsible for any payment disputes.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">4. User Responsibilities</h2>
                    <p>All users (customers and experts) agree to:</p>
                    <ul className="list-disc pl-6 space-y-2 my-4">
                        <li>Provide correct and truthful information in their profiles and communications.</li>
                        <li>Use the platform respectfully and professionally.</li>
                        <li>Avoid any misuse, spam, or illegal activities on the platform.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">5. Expert Responsibilities</h2>
                    <p>Experts additionally agree to:</p>
                    <ul className="list-disc pl-6 space-y-2 my-4">
                        <li>Provide genuine and high-quality services as advertised.</li>
                        <li>Adhere to all local laws and regulations relevant to their services.</li>
                        <li>Maintain professional and courteous behavior with all customers.</li>
                    </ul>
                    <p>MyExpert reserves the right to suspend or remove any user account that violates these terms without notice.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">6. Account Termination</h2>
                    <p>Users may delete their account at any time through the app. MyExpert may also suspend or terminate accounts for violations of these terms, illegal activities, or other misuse of the platform.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">7. Changes to Terms</h2>
                    <p>We may update these Terms & Conditions at any time. We will notify users of significant changes, but continued use of the app after updates constitutes acceptance of the new terms.</p>
                </div>
            </div>
        </main>
    );
}
