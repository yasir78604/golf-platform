import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

const steps = [
  {
    title: 'Subscribe',
    desc: 'Choose a monthly or yearly plan to join the golf score lottery.',
  },
  {
    title: 'Log scores',
    desc: 'Enter your latest golf scores. Your last 5 rounds are used in each draw.',
  },
  {
    title: 'Win & give',
    desc: 'Match drawn numbers to win prizes. A portion always goes to charity.',
  },
]

function Home() {
  const { user } = useAuth()

  const ctaLink = user
    ? user.subscription_status === 'active'
      ? '/dashboard'
      : '/pricing'
    : '/register'

  const ctaLabel = user
    ? user.subscription_status === 'active'
      ? 'Go to Dashboard'
      : 'View Plans'
    : 'Get Started'

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent/20">
          <span className="text-4xl">⛳</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Golf Score Lottery
        </h1>
        <p className="text-[#888] text-lg max-w-xl mx-auto mb-8">
          Turn your golf scores into a chance to win. Subscribe, log your rounds,
          and compete in monthly prize draws while supporting charities.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={ctaLink}>
            <Button className="sm:w-auto px-8">{ctaLabel}</Button>
          </Link>
          <Link to="/charities">
            <Button variant="secondary" className="sm:w-auto px-8">Our Charities</Button>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <Card key={step.title} className="text-center">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/20 text-accent font-bold">
                {i + 1}
              </div>
              <h3 className="text-white font-semibold mb-2">{step.title}</h3>
              <p className="text-[#888] text-sm">{step.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <Card className="text-center py-10">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to play?</h2>
          <p className="text-[#888] mb-6">Join today and start logging your scores.</p>
          <Link to={ctaLink} className="inline-block">
            <Button className="w-auto px-8">{ctaLabel}</Button>
          </Link>
        </Card>
      </section>
    </Layout>
  )
}

export default Home
