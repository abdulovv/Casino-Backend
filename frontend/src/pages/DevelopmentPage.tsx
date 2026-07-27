import { ArrowLeft, Construction, Rocket, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

interface DevelopmentPageProps {
  mode: 'upgrade' | 'crash'
}

const pageContent = {
  upgrade: {
    title: 'Апгрейд',
    description: 'Здесь можно будет выбрать предмет из инвентаря и попытаться улучшить его до более ценного.',
    icon: TrendingUp,
  },
  crash: {
    title: 'Краш',
    description: 'Здесь появится раунд с растущим коэффициентом и возможностью вовремя забрать результат.',
    icon: Rocket,
  },
}

export function DevelopmentPage({ mode }: DevelopmentPageProps) {
  const content = pageContent[mode]
  const Icon = content.icon

  return (
    <main className="development-page">
      <Link className="page-back-link" to="/">
        <ArrowLeft size={16} />
        Все игры
      </Link>

      <section className={`development-card development-card--${mode}`}>
        <div className="development-card__icon" aria-hidden="true">
          <Icon size={82} strokeWidth={1.6} />
        </div>
        <span className="development-card__status">
          <Construction size={15} />
          В разработке
        </span>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        <Link className="hub-intro__button" to="/cases">
          Пока открыть кейсы
        </Link>
      </section>
    </main>
  )
}
