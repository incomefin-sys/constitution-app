import { useState, useContext, useRef } from 'react'
import { AppContext } from '../App'
import questions from '../data/questions.json'

const SESSIONS_KEY = 'konst_quiz_sessions'
const MISSED_KEY   = 'konst_quiz_missed'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function prepareQuestion(q) {
  const indexed = q.options.map((text, idx) => ({ text, idx }))
  const shuffled = shuffle(indexed)
  return {
    ...q,
    displayOptions: shuffled.map(o => o.text),
    displayCorrect: shuffled.findIndex(o => o.idx === q.correct),
  }
}

function saveSession(score, total, missedMap) {
  const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]')
  sessions.push({ score, total, date: Date.now() })
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))

  const global = JSON.parse(localStorage.getItem(MISSED_KEY) || '{}')
  for (const [id, cnt] of Object.entries(missedMap)) {
    global[id] = (global[id] || 0) + cnt
  }
  localStorage.setItem(MISSED_KEY, JSON.stringify(global))
}

export default function Quiz() {
  const { i18n, setTab } = useContext(AppContext)

  const [phase, setPhase]   = useState('start')  // start | playing | results
  const [count, setCount]   = useState(20)
  const [deck,  setDeck]    = useState([])
  const [cur,   setCur]     = useState(0)
  const [selected, setSelected] = useState(null)
  const [showCorrect, setShowCorrect] = useState(false)

  // Use refs to avoid stale closure issues in setTimeout
  const scoreRef  = useRef(0)
  const missedRef = useRef({})

  // Exposed state for results screen
  const [finalScore, setFinalScore] = useState(0)
  const [finalTotal, setFinalTotal] = useState(0)

  const startQuiz = () => {
    const sample = shuffle(questions).slice(0, count)
    const prepared = sample.map(prepareQuestion)
    setDeck(prepared)
    setCur(0)
    setSelected(null)
    setShowCorrect(false)
    scoreRef.current  = 0
    missedRef.current = {}
    setPhase('playing')
  }

  const handleAnswer = (idx) => {
    if (selected !== null) return

    const q = deck[cur]
    setSelected(idx)
    setShowCorrect(true)

    const isCorrect = idx === q.displayCorrect
    if (isCorrect) {
      scoreRef.current += 1
    } else {
      missedRef.current[q.id] = (missedRef.current[q.id] || 0) + 1
    }

    setTimeout(() => {
      const next = cur + 1
      if (next >= deck.length) {
        const fs = scoreRef.current
        const ft = deck.length
        saveSession(fs, ft, { ...missedRef.current })
        setFinalScore(fs)
        setFinalTotal(ft)
        setPhase('results')
      } else {
        setCur(next)
        setSelected(null)
        setShowCorrect(false)
      }
    }, 1200)
  }

  /* ── Start screen ──────────────────────────────────────────── */
  if (phase === 'start') {
    return (
      <div className="screen">
        <div className="card">
          <h2 className="card-title">{i18n.quiz.selectCount}</h2>
          <div className="count-row">
            {[20, 50, 100].map(n => (
              <button
                key={n}
                className={`count-btn${count === n ? ' active' : ''}`}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="hint">{i18n.quiz.note}</p>
          <button className="btn-primary" onClick={startQuiz}>
            {i18n.quiz.start}
          </button>
        </div>
      </div>
    )
  }

  /* ── Playing ───────────────────────────────────────────────── */
  if (phase === 'playing') {
    const q = deck[cur]
    const progress = (cur / deck.length) * 100

    return (
      <div className="screen quiz-playing">
        {/* Progress */}
        <div className="progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-label">{cur + 1} / {deck.length}</span>
        </div>

        {/* Question */}
        <div className="card question-card">
          <p className="section-tag">{q.section}</p>
          <p className="question-text">{q.question}</p>
        </div>

        {/* Options */}
        <div className="options">
          {q.displayOptions.map((opt, idx) => {
            let cls = 'option-btn'
            if (showCorrect) {
              if (idx === q.displayCorrect)       cls += ' opt-correct'
              else if (idx === selected)           cls += ' opt-wrong'
              else                                 cls += ' opt-dim'
            }
            return (
              <button key={idx} className={cls} onClick={() => handleAnswer(idx)}>
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── Results ───────────────────────────────────────────────── */
  const pct    = Math.round((finalScore / finalTotal) * 100)
  const passed = pct >= 70

  return (
    <div className="screen screen-center">
      <div className="card results-card">
        <h2 className="card-title">{i18n.quiz.result}</h2>

        <div className={`score-ring ${passed ? 'ring-pass' : 'ring-fail'}`}>
          <span className="ring-pct">{pct}%</span>
          <span className="ring-frac">{finalScore} {i18n.quiz.of} {finalTotal}</span>
        </div>

        <div className={`verdict ${passed ? 'verdict-pass' : 'verdict-fail'}`}>
          {passed ? i18n.quiz.pass : i18n.quiz.fail}
        </div>

        <button className="btn-primary" onClick={() => setPhase('start')}>
          {i18n.quiz.restart}
        </button>
        <button className="btn-ghost" onClick={() => setTab('stats')}>
          {i18n.quiz.goStats}
        </button>
      </div>
    </div>
  )
}
