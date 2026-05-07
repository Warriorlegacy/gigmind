import Navigation from '@/components/shared/Navigation'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F0F13] text-white">
      <Navigation />
      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 font-display">Privacy Policy</h1>
        
        <div className="space-y-8 text-gray-400 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-4 text-white font-display">1. Introduction</h2>
            <p>
              Welcome to GigMind. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-white font-display">2. Data We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><span className="text-white font-medium">Identity Data:</span> includes first name, last name, username or similar identifier.</li>
              <li><span className="text-white font-medium">Contact Data:</span> includes email address and telephone numbers.</li>
              <li><span className="text-white font-medium">Profile Data:</span> includes your username and password, service interests, preferences, feedback and survey responses.</li>
              <li><span className="text-white font-medium">Technical Data:</span> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-white font-display">3. How We Use Your Data</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to provide the services you requested, to manage your account, and to improve our platform through AI-driven insights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-white font-display">4. DPDP Act 2023 Compliance</h2>
            <p>
              In accordance with the Digital Personal Data Protection Act, 2023 (India), we ensure that your personal data is processed for a lawful purpose for which you have given your consent. You have the right to access, correct, and erase your personal data.
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
