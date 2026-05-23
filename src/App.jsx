import { useState, createContext, useContext } from 'react'
import Quiz from './components/Quiz'
import Terms from './components/Terms'
import Stats from './components/Stats'
import ru from './i18n/ru'
import lt from './i18n/lt'

export const AppContext = createContext()

const LANG_KEY = 'konst_lang'

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'ru')
  const [tab, setTab] = useState('quiz')

  const i18n = lang === 'ru' ? ru : lt

  const toggleLang = () => {
    const next = lang === 'ru' ? 'lt' : 'ru'
    setLang(next)
    localStorage.setItem(LANG_KEY, next)
  }

  return (
    <AppContext.Provider value={{ lang, i18n, setTab }}>
      <div className="app">
        <header className="app-header">
          <span className="app-title">Konstitucija</span>
          <button className="lang-btn" onClick={toggleLang} aria-label="Toggle language">
            {lang === 'ru' ? '🇱🇹 LT' : '🇷🇺 RU'}
          </button>
        </header>

        <main className="app-main">
          {tab === 'quiz'  && <Quiz />}
          {tab === 'terms' && <Terms />}
          {tab === 'stats' && <Stats />}
        </main>

        <nav className="bottom-nav">
          {[
            { id: 'quiz',  icon: '📝', label: i18n.tabs.quiz  },
            { id: 'terms', icon: '📚', label: i18n.tabs.terms },
            { id: 'stats', icon: '📊', label: i18n.tabs.stats },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              className={`nav-item${tab === id ? ' active' : ''}`}
              onClick={() => setTab(id)}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </AppContext.Provider>
  )
}
