import Navigation from '@/components/shared/Navigation'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0F0F13] text-white">
      <Navigation />
      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 font-display">Terms of Service</h1>
        
        <div className="space-y-8 text-gray-400 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-4 text-white font-display">1. Agreement to Terms</h2>
            <p>
              By accessing or using GigMind, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-white font-display">2. Service Description</h2>
            <p>
              GigMind is a platform connecting hirers with service providers. We provide the infrastructure for communication, job posting, and portfolio management. We do not directly provide the services listed by providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-white font-display">3. User Obligations</h2>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account.</li>
              <li>You agree not to use the service for any illegal or unauthorized purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-white font-display">4. Payments and Commissions</h2>
            <p>
              GigMind may charge a commission on successful transactions completed through the platform. Specific fee structures will be communicated during the hiring process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-white font-display">5. Dispute Resolution</h2>
            <p>
              In case of disputes between a hirer and a provider, GigMind may offer mediation services but is not legally liable for the outcome of service delivery or payments between parties.
            </p>
          </section>

          <section>
            <p className="text-xs">Last updated: May 2026</p>
          </section>
        </div>
      </div>
    </div>
  )
}
