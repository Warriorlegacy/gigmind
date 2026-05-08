import Navigation from '@/components/shared/Navigation'

const terms = [
  ['1. Acceptance', 'By accessing or using GigMind, you agree to these Terms of Service. If you do not agree, you must not use the platform.'],
  ['2. Services', 'GigMind is a technology marketplace that connects hirers and independent service providers. GigMind does not directly provide the listed services and is not an employer, agency, or contractor for providers.'],
  ['3. User Accounts', 'You must provide accurate account information, keep credentials secure, use your own phone or email, and promptly update profile, location, payment, and service details when they change.'],
  ['4. Provider Obligations', 'Providers must describe services truthfully, honor agreed pricing and timelines, maintain required licenses where applicable, protect user data, and deliver work with professional care.'],
  ['5. Payments and Escrow', 'GigMind may charge a 10% platform commission on successful transactions. Escrow funds may be held until milestone completion, user release, dispute resolution, or auto-release after seven days when the agreed SLA has passed without a valid dispute.'],
  ['6. Prohibited Conduct', 'You may not post illegal, unsafe, deceptive, hateful, abusive, infringing, spam, adult, exploitative, or fraudulent content; bypass marketplace fees; scrape data; attack systems; or misuse AI features.'],
  ['7. Disputes', 'GigMind may provide tools, summaries, chat records, and mediation support for disputes. Final responsibility for service delivery and offline interactions remains with the hirer and provider unless applicable law says otherwise.'],
  ['8. Limitation of Liability', 'To the maximum extent permitted by law, GigMind is not liable for indirect, incidental, consequential, punitive, or loss-of-profit damages arising from marketplace use, provider conduct, or third-party services.'],
  ['9. Governing Law', 'These terms are governed by the laws of India. Courts and competent authorities in Uttar Pradesh, India will have jurisdiction unless mandatory consumer law requires otherwise.'],
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0F0F13] text-white">
      <Navigation />
      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <p className="text-sm text-brand mb-3">Last updated: May 2026</p>
        <h1 className="text-4xl font-bold mb-8 font-display">Terms of Service</h1>
        <div className="space-y-8 text-gray-400 text-sm leading-relaxed">
          {terms.map(([title, body]) => (
            <section key={title} className="rounded-2xl bg-[#1A1A24] border border-[#2A2A3A] p-6">
              <h2 className="text-xl font-bold mb-4 text-white font-display">{title}</h2>
              <p>{body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
