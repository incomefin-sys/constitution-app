import { useState, useContext } from 'react'
import { AppContext } from '../App'
import questions from '../data/questions.json'
import glossary  from '../data/glossary.json'

const SESSIONS_KEY     = 'konst_quiz_sessions'
const QUIZ_MISSED_KEY  = 'konst_quiz_missed'
const TERMS_STATS_KEY  = 'konst_terms_stats'
const TERMS_MISSED_KEY = 'konst_terms_missed'

const qMap = Object.fromEntries(questions.map(q => [q.id, q]))
const tMap = Object.fromEntries(glossary.map(t => [t.id, t]))

function pct(num, den) {
  return den > 0 ? Math.round((num / den) * 100) : 0
}

export default function Stats() {
  const { i18n } = useContext(AppContext)
  const [, forceUpdate] = useState(0)

  const sessions    = JSON.parse(localStorage.getItem(SESSIONS_KEY)     || '[]')
  const quizMissed  = JSON.parse(localStorage.getItem(QUIZ_MISSED_KEY)  || '{}')
  const termsStats  = JSON.parse(localStorage.getItem(TERMS_STATS_KEY)  || '{"total":0,"correct":0}')
  const termsMissed = JSON.parse(localStorage.getItem(TERMS_MISSED_KEY) || '{}')

  /* Quiz aggregates */
  const totalSessions = sessions.length
  const avgScore  = totalSessions > 0
    ? Math.round(sessions.reduce((s, x) => s + pct(x.score, x.total), 0) / totalSessions)
    : 0
  const bestScore = totalSessions > 0
    ? Math.max(...sessions.map(x => pct(x.score, x.total)))
    : 0
  const passRate  = totalSessions > 0
    ? Math.round(sessions.filter(x => pct(x.score, x.total) >= 70).length / totalSessions * 100)
    : 0

  const last10 = sessions.slice(-10)

  const topQuestions = Object.entries(quizMissed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, cnt]) => ({ q: qMap[Number(id)], cnt }))
    .filter(x => x.q)

  /* Terms aggregates */
  const termsCorrectRate = pct(termsStats.correct, termsStats.total)
  const topTerms = Object.entries(termsMissed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, cnt]) => ({ t: tMap[Number(id)], cnt }))
    .filter(x => x.t)

  const handleReset = () => {
    if (!window.confirm(i18n.stats.resetConfirm)) return
    ;[SESSIONS_KEY, QUIZ_MISSED_KEY, TERMS_STATS_KEY, TERMS_MISSED_KEY]
      .forEach(k => localStorage.removeItem(k))
    forceUpdate(n => n + 1)
  }

  const isEmpty = totalSessions === 0 && termsStats.total === 0

  return (
    <div className="screen stats-screen">
      {isEmpty ? (
        <div className="card empty-card">
          <span className="empty-icon">📊</span>
          <p>{i18n.stats.noData}</p>
        </div>
      ) : (
        <>
          {/* ── Quiz stats ───────────────────────────── */}
          {totalSessions > 0 && (
            <>
              <div className="card">
                <h2 className="section-heading">{i18n.stats.quizTitle}</h2>
                <StatRow label={i18n.stats.sessions}  value={totalSessions} />
                <StatRow label={i18n.stats.avgScore}  value={`${avgScore}%`} />
                <StatRow label={i18n.stats.bestScore} value={`${bestScore}%`} />
                <StatRow label={i18n.stats.passRate}  value={`${passRate}%`} />
              </div>

              {/* Bar chart */}
              <div className="card">
                <h3 className="sub-heading">{i18n.stats.last10}</h3>
                <div className="bar-chart">
                  {last10.map((s, i) => {
                    const p = pct(s.score, s.total)
                    const passed = p >= 70
                    const barH = Math.max(4, Math.round(p / 100 * 72))
                    return (
                      <div key={i} className="bar-col">
                        <span className="bar-pct">{p}%</span>
                        <div
                          className={`bar-fill ${passed ? 'bar-pass' : 'bar-fail'}`}
                          style={{ height: `${barH}px` }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Weak questions */}
              {topQuestions.length > 0 && (
                <div className="card">
                  <h3 className="sub-heading">{i18n.stats.weakSpots}</h3>
                  {topQuestions.map(({ q, cnt }, i) => (
                    <details key={i} className="weak-item">
                      <summary className="weak-summary">
                        <span className="weak-preview">
                          {q.question.length > 70
                            ? q.question.slice(0, 70) + '…'
                            : q.question}
                        </span>
                        <span className="miss-badge">{cnt}</span>
                      </summary>
                      <div className="weak-body">
                        <p className="weak-full">{q.question}</p>
                        <p className="weak-section">{q.section}</p>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Terms stats ──────────────────────────── */}
          {termsStats.total > 0 && (
            <>
              <div className="card">
                <h2 className="section-heading">{i18n.stats.termsTitle}</h2>
                <StatRow label={i18n.stats.termsTotal}       value={termsStats.total} />
                <StatRow label={i18n.stats.termsCorrectRate} value={`${termsCorrectRate}%`} />
              </div>

              {topTerms.length > 0 && (
                <div className="card">
                  <h3 className="sub-heading">{i18n.stats.termsMissed}</h3>
                  {topTerms.map(({ t, cnt }, i) => (
                    <div key={i} className="term-row">
                      <div className="term-pair">
                        <span className="term-lt">{t.term}</span>
                        <span className="term-ru">{t.definition}</span>
                      </div>
                      <span className="miss-badge">{cnt}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Reset button */}
      {!isEmpty && (
        <button className="btn-reset" onClick={handleReset}>
          {i18n.stats.reset}
        </button>
      )}
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
    </div>
  )
}
