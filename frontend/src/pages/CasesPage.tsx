import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CaseVisual } from '../components/CaseVisual'
import { apiRequest, formatCoins, getFriendlyError } from '../lib/api'
import type { GameCase } from '../types/api'

const cardDescriptions = [
  'Яркий старт и новая находка для твоей коллекции.',
  'Тёмная подборка с характером и редкими предметами.',
  'Тёмная классика CatCase для следующего открытия.',
]

export function CasesPage() {
  const [cases, setCases] = useState<GameCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCases = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setCases(await apiRequest<GameCase[]>('/api/cases'))
    } catch (requestError) {
      setError(getFriendlyError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCases()
  }, [loadCases])

  return (
    <main className="home-page home-hub">
      <header className="cases-page-heading">
        <Link className="page-back-link" to="/">
          <ArrowLeft size={16} />
          Все игры
        </Link>
        <h1>Кейсы</h1>
      </header>

      <section className="hub-catalog" id="cases">
        {loading && (
          <div className="hub-case-list" aria-label="Загрузка кейсов">
            {[1, 2, 3].map((item) => (
              <div className="hub-case-card hub-case-card--skeleton" key={item} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="state-card">
            <p>{error}</p>
            <button className="secondary-button" onClick={loadCases} type="button">
              <RefreshCw size={17} />
              Повторить
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="hub-case-list">
            {cases.map((caseItem, index) => (
              <Link
                aria-label={`Открыть кейс ${caseItem.name}`}
                className={`hub-case-card hub-case-card--tone-${(index % 3) + 1}`}
                key={caseItem.id}
                to={`/cases/${caseItem.id}`}
              >
                <div className="hub-case-card__copy">
                  <span className="hub-case-card__index">
                    CASE {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3>{caseItem.name}</h3>
                  <p>{cardDescriptions[index % cardDescriptions.length]}</p>

                  <div className="hub-case-card__action">
                    <span className="hub-case-card__price">
                      <span>{formatCoins(caseItem.price)}</span>
                      <span className="currency-star">⭐</span>
                    </span>
                    <span className="hub-case-card__open">
                      Открыть
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </div>

                <div className="hub-case-card__visual" aria-hidden="true">
                  <span className="hub-case-card__halo" />
                  <CaseVisual
                    caseId={caseItem.id}
                    imageUrl={caseItem.imageUrl}
                    itemName={caseItem.name}
                    size="medium"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
