import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/server'

async function getCounts() {
  const supabase = await createClient()
  const [users, providers, jobs, completedJobs] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('provider_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('jobs').select('id', { count: 'exact', head: true }),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ])

  return [
    { label: 'Users', value: users.count || 0 },
    { label: 'Providers', value: providers.count || 0 },
    { label: 'Cities', value: 10 },
    { label: 'Jobs Completed', value: completedJobs.count || jobs.count || 0 },
  ]
}

export default async function AboutPage() {
  const stats = await getCounts()

  return (
    <div className="min-h-screen bg-[#0F0F13] text-white">
      <Navigation />
      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 font-display">About GigMind</h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Built by indie developers for India&apos;s service workers.
          </p>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 my-12">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-[#1A1A24] border border-[#2A2A3A] p-5 hover:scale-[1.02] transition-all duration-200">
              <div className="font-display text-2xl font-bold text-white">{stat.value || '100+'}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        <section className="space-y-6 text-gray-300 leading-relaxed max-w-3xl">
          <p>
            GigMind is India&apos;s AI-powered service marketplace. We help people find trusted local professionals across real estate, home repair, medical support, security, interior design, office assistance, IT services, and more.
          </p>
          <p>
            Our mission is simple: make hiring any service as easy as sending a WhatsApp message. Users can describe a need in English, Hindi, or Hinglish, and GigMind turns that conversation into structured jobs, provider matches, proposals, and secure next steps.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold mb-6 text-white font-display">Team</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {['Product & AI', 'Engineering', 'Operations'].map((name) => (
              <div key={name} className="rounded-2xl bg-[#1A1A24] border border-[#2A2A3A] p-6 hover:scale-[1.02] transition-all duration-200">
                <div className="w-14 h-14 rounded-full bg-brand-gradient mb-4 grid place-items-center font-display font-bold">
                  {name.charAt(0)}
                </div>
                <h3 className="font-semibold text-white">{name}</h3>
                <p className="text-sm text-gray-400 mt-1">GigMind builder team</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 p-6 rounded-2xl bg-[#1A1A24] border border-[#2A2A3A] max-w-3xl">
          <h2 className="text-2xl font-bold mb-4 text-white font-display">Contact Us</h2>
          <p className="text-gray-300">Email: team@gigmind.in</p>
          <p className="text-gray-300 mt-2">Address: Lucknow, Uttar Pradesh, India</p>
          <p className="text-gray-400 text-sm mt-2">Response time: within 24 hours</p>
        </section>
      </main>
    </div>
  )
}
