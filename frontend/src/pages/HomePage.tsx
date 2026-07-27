import { Boxes, Rocket, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

const gameModes = [
  {
    path: '/cases',
    className: 'game-mode-card--cases',
    eyebrow: 'Доступно сейчас',
    title: 'Кейсы',
    description: 'Открывай кейсы и собирай предметы в личном инвентаре.',
    icon: Boxes,
  },
  {
    path: '/upgrade',
    className: 'game-mode-card--upgrade',
    eyebrow: 'В разработке',
    title: 'Апгрейд',
    description: 'Попробуй превратить предмет из коллекции в более ценный.',
    icon: TrendingUp,
  },
  {
    path: '/crash',
    className: 'game-mode-card--crash',
    eyebrow: 'В разработке',
    title: 'Краш',
    description: 'Следи за полётом и успей остановиться в нужный момент.',
    icon: Rocket,
  },
]

export function HomePage() {
  return (
    <main className="game-menu-page">
      <section className="game-menu-heading">
        <span className="section-kicker">CatCase</span>
        <h1>Выбери режим</h1>
        <p>Кейсы, магазин и твоя коллекция предметов — в одном месте.</p>
      </section>

      <section className="game-mode-list" aria-label="Режимы игры">
        {gameModes.map(({ path, className, eyebrow, title, description, icon: Icon }) => (
          <Link className={`game-mode-card ${className}`} key={path} to={path}>
            <div className="game-mode-card__copy">
              <span className="game-mode-card__eyebrow">
                {eyebrow}
              </span>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <div className="game-mode-card__visual" aria-hidden="true">
              {path === '/cases' ? (
                <span className="mode-box-stack">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <Icon size={74} strokeWidth={1.55} />
              )}
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}
