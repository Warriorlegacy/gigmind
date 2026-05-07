import Navigation from '@/components/shared/Navigation'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0F0F13] text-white">
      <Navigation />
      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 font-display">About GigMind</h1>
        
        <div className="space-y-6 text-gray-300 leading-relaxed">
          <p>
            GigMind is India&apos;s first AI-powered service marketplace. We are revolutionizing how people find and hire local professionals by combining the power of Generative AI with a trusted community of service providers.
          </p>
          
          <p>
            Whether you need a real estate consultant, a medical professional, or a software engineer, GigMind helps you find the right match in seconds. Our AI Assistant understands your needs and connects you with providers who are ready to help.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white font-display">Our Mission</h2>
          <p>
            Our mission is to make hiring any service as easy as sending a WhatsApp message. We aim to empower thousands of independent professionals across India with tools to grow their business and reach more customers.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white font-display">Contact Us</h2>
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
            <p className="mb-2"><span className="text-white font-medium">Email:</span> support@gigmind.in</p>
            <p><span className="text-white font-medium">Address:</span> Lucknow, Uttar Pradesh, India</p>
          </div>
        </div>
      </div>
    </div>
  )
}
