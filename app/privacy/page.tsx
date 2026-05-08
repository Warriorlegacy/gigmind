import Navigation from '@/components/shared/Navigation'

const sections = [
  ['1. Introduction', 'This Privacy Policy explains how GigMind collects, uses, stores, shares, and protects personal data under India’s Digital Personal Data Protection Act, 2023. By using GigMind, you consent to the data practices needed to operate a trusted AI-assisted service marketplace.'],
  ['2. Data We Collect', 'We collect identity data, contact data, provider profile data, job and application data, messages, payment and escrow metadata, device and technical data, approximate location, support requests, and AI interaction content that you choose to submit.'],
  ['3. How We Use Your Data', 'We use data to create accounts, match hirers with providers, generate AI-assisted job posts and proposals, process applications, support payments, prevent fraud, moderate content, improve safety, send notifications, and comply with legal obligations.'],
  ['4. Storage and Security', 'Data is stored with managed cloud infrastructure and protected using authentication, Supabase row-level security, access controls, encryption in transit, and operational monitoring. We retain data only for as long as needed for marketplace, legal, tax, fraud-prevention, and dispute-resolution purposes.'],
  ['5. Data Sharing', 'We do not sell personal data. We share limited data with providers, hirers, payment processors, authentication providers, email/SMS providers, analytics and hosting vendors, legal authorities when required, and internal administrators who need access to operate GigMind.'],
  ['6. Your Rights', 'Under the DPDP Act 2023, you may request access, correction, completion, updating, erasure, grievance redressal, and withdrawal of consent where applicable. Some data may be retained when required for legal claims, safety, tax, payments, or fraud prevention.'],
  ['7. Cookies', 'GigMind uses essential cookies for authentication and security, plus limited preference and analytics storage to improve performance and reliability. You can control browser storage through your device settings, but some features may stop working.'],
  ['8. Contact', 'For privacy requests, account deletion, or DPDP grievances, contact team@gigmind.in. We aim to acknowledge privacy requests promptly and resolve valid requests within a reasonable period under applicable Indian law.'],
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F0F13] text-white">
      <Navigation />
      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <p className="text-sm text-brand mb-3">Effective date: May 1, 2026</p>
        <h1 className="text-4xl font-bold mb-8 font-display">Privacy Policy</h1>
        <div className="space-y-8 text-gray-400 text-sm leading-relaxed">
          {sections.map(([title, body]) => (
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
