import { useState, useContext } from 'react'
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
  // Shuffle the indices, not the text — text is derived from source data at render time
  const indices  = q.options.map((_, i) => i)
  const shuffled = shuffle(indices)          // e.g. [2, 0, 3, 1]
  return {
    ...q,
    shuffleOrder:  shuffled,                  // permutation to apply to options array
    displayCorrect: shuffled.indexOf(q.correct),
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
  const { i18n, lang, setTab } = useContext(AppContext)

  const [phase, setPhase]     = useState('start')   // start | playing | results
  const [count, setCount]     = useState(20)
  const [deck,  setDeck]      = useState([])
  const [cur,   setCur]       = useState(0)
  // answers[i] = null (unanswered) or the index the user tapped
  const [answers, setAnswers] = useState([])

  const [finalScore, setFinalScore] = useState(0)
  const [finalTotal, setFinalTotal] = useState(0)

  const startQuiz = () => {
    const sample   = shuffle(questions).slice(0, count)
    const prepared = sample.map(prepareQuestion)
    setDeck(prepared)
    setCur(0)
    setAnswers(new Array(prepared.length).fill(null))
    setPhase('playing')
  }

  const handleAnswer = (idx) => {
    if (answers[cur] !== null) return   // already answered — no re-selection
    setAnswers(prev => {
      const next = [...prev]
      next[cur] = idx
      return next
    })
  }

  const goPrev = () => {
    if (cur > 0) setCur(cur - 1)
  }

  const goNext = () => {
    if (cur === deck.length - 1) {
      // Last question — tally and save
      const score = answers.filter(
        (sel, i) => sel !== null && sel === deck[i].displayCorrect
      ).length
      const missedMap = {}
      answers.forEach((sel, i) => {
        if (sel === null || sel !== deck[i].displayCorrect) {
          const id = String(deck[i].id)
          missedMap[id] = (missedMap[id] || 0) + 1
        }
      })
      saveSession(score, deck.length, missedMap)
      setFinalScore(score)
      setFinalTotal(deck.length)
      setPhase('results')
    } else {
      setCur(cur + 1)
    }
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
    const q        = deck[cur]
    const answered = answers[cur] !== null
    const selected = answers[cur]          // null or tapped index
    const isLast   = cur === deck.length - 1
    const progress = ((cur + 1) / deck.length) * 100

    // Derive display text from source data + current language on every render
    const qText    = lang === 'ru' && q.question_ru ? q.question_ru : q.question
    const srcOpts  = lang === 'ru' && q.options_ru  ? q.options_ru  : q.options
    const dispOpts = q.shuffleOrder.map(i => srcOpts[i])

    return (
      <div className="screen quiz-playing">
        {/* Progress bar */}
        <div className="progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-label">{cur + 1} / {deck.length}</span>
        </div>

        {/* Question card */}
        <div className="card question-card">
          <p className="section-tag">{q.section}</p>
          <p className="question-text">{qText}</p>
        </div>

        {/* Answer options */}
        <div className="options">
          {dispOpts.map((opt, idx) => {
            let cls = 'option-btn'
            if (answered) {
              if (idx === q.displayCorrect) cls += ' opt-correct'
              else if (idx === selected)    cls += ' opt-wrong'
              else                          cls += ' opt-dim'
            }
            return (
              <button key={idx} className={cls} onClick={() => handleAnswer(idx)}>
                {opt}
              </button>
            )
          })}
        </div>

        {/* Floating ← / → navigation */}
        <div className="quiz-float-nav">
          <button
            className="float-btn float-prev"
            onClick={goPrev}
            disabled={cur === 0}
            aria-label="Previous question"
          >
            ←
          </button>
          <button
            className={`float-btn float-next${isLast ? ' float-results' : ''}`}
            onClick={goNext}
            disabled={!answered}
            aria-label={isLast ? i18n.quiz.results : 'Next question'}
          >
            {isLast ? i18n.quiz.results : '→'}
          </button>
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
