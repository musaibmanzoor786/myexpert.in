import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto py-12 px-6 sm:py-20 sm:px-8">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
                </Link>
                <div className="mb-10 pb-6 border-b border-border">
                    <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">Privacy Policy</h1>
                    <p className="text-muted-foreground">Last updated: May 26, 2026</p>
                </div>
                
                <div className="prose prose-slate max-w-none text-muted-foreground">
                    <p>MyExpert is built to connect customers with independent service experts. This Privacy Policy explains how we collect, use, and protect your information when you use our app. By using MyExpert, you agree to this policy.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">1. Information We Collect</h2>
                    <p>To provide a better experience, we may ask for personal information, including:</p>
                    <ul className="list-disc pl-6 space-y-2 my-4">
                        <li>Name</li>
                        <li>Phone number</li>
                        <li>Email address</li>
                        <li>Location (city or area)</li>
                        <li>Profile details</li>
                    </ul>
                    <p>This information is used only to connect customers and experts and to ensure platform safety. Providing this information is necessary to use core features of the app.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">2. Data Sharing</h2>
                    <p>MyExpert does not sell or rent your personal information. Your basic details may be shared only between customer and expert for service-related communication. We do not share your data with third parties except when required by law.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">3. Data Security</h2>
                    <p>We value your trust and use reasonable security measures to protect your information. However, no method of electronic storage is 100% secure.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">4. Children's Privacy</h2>
                    <p>MyExpert is intended for users 15 years of age and above. We do not knowingly collect information from children under 15.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">5. Changes to This Policy</h2>
                    <p>We may update this Privacy Policy from time to time. Changes will be effective once posted in the app.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">6. Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, you can contact us via WhatsApp: <a href="https://wa.me/9103669564" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">+91 9103669564</a></p>
                </div>
            </div>
        </main>
    );
}
