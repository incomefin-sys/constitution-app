import { useState, useContext } from 'react'
import { AppContext } from '../App'
import glossary from '../data/glossary.json'

const STATS_KEY  = 'konst_terms_stats'
const MISSED_KEY = 'konst_terms_missed'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildCard(term, mode, pool) {
  const correct   = mode === 'A' ? term.definition : term.term
  const distPool  = pool.filter(t => t.id !== term.id)
  const distractors = shuffle(distPool)
    .slice(0, 3)
    .map(t => mode === 'A' ? t.definition : t.term)
  const options = shuffle([correct, ...distractors])
  return { options, correctIdx: options.indexOf(correct) }
}

function recordAnswer(termId, correct) {
  const stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{"total":0,"correct":0}')
  stats.total  += 1
  if (correct) stats.correct += 1
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))

  if (!correct) {
    const missed = JSON.parse(localStorage.getItem(MISSED_KEY) || '{}')
    missed[termId] = (missed[termId] || 0) + 1
    localStorage.setItem(MISSED_KEY, JSON.stringify(missed))
  }
}

export default function Terms() {
  const { i18n } = useContext(AppContext)

  const [mode,       setMode]       = useState(null)
  const [queue,      setQueue]      = useState([])
  const [pos,        setPos]        = useState(0)
  const [options,    setOptions]    = useState([])
  const [correctIdx, setCorrectIdx] = useState(null)
  const [selected,   setSelected]   = useState(null)

  const startMode = (m) => {
    const q = shuffle([...glossary])
    const { options: opts, correctIdx: ci } = buildCard(q[0], m, glossary)
    setMode(m)
    setQueue(q)
    setPos(0)
    setOptions(opts)
    setCorrectIdx(ci)
    setSelected(null)
  }

  const handleAnswer = (idx) => {
    if (selected !== null) return
    setSelected(idx)
    const term = queue[pos]
    recordAnswer(term.id, idx === correctIdx)
  }

  const handleNext = () => {
    let nextPos   = pos + 1
    let nextQueue = queue

    if (nextPos >= queue.length) {
      nextPos   = 0
      nextQueue = shuffle([...glossary])
      setQueue(nextQueue)
    }

    const { options: opts, correctIdx: ci } = buildCard(nextQueue[nextPos], mode, glossary)
    setPos(nextPos)
    setOptions(opts)
    setCorrectIdx(ci)
    setSelected(null)
  }

  /* ── Mode select ───────────────────────────────────────────── */
  if (!mode) {
    return (
      <div className="screen">
        <div className="card">
          <h2 className="card-title">{i18n.terms.selectMode}</h2>
          <button className="mode-btn" onClick={() => startMode('A')}>
            🇱🇹 → 🇷🇺&ensp;{i18n.terms.modeA}
          </button>
          <button className="mode-btn" onClick={() => startMode('B')}>
            🇷🇺 → 🇱🇹&ensp;{i18n.terms.modeB}
          </button>
        </div>
      </div>
    )
  }

  /* ── Study screen ──────────────────────────────────────────── */
  const term   = queue[pos]
  const prompt = mode === 'A' ? term.term : term.definition
  const flag   = mode === 'A' ? '🇱🇹' : '🇷🇺'

  return (
    <div className="screen terms-screen">
      {/* Counter */}
      <div className="terms-counter">
        {pos + 1} / {queue.length}
      </div>

      {/* Prompt */}
      <div className="card question-card">
        <p className="section-tag">{flag} {mode === 'A' ? i18n.terms.modeA.split('→')[0].trim() : i18n.terms.modeB.split('→')[0].trim()}</p>
        <p className="term-text">{prompt}</p>
      </div>

      {/* Options */}
      <div className="options">
        {options.map((opt, idx) => {
          let cls = 'option-btn'
          if (selected !== null) {
            if (idx === correctIdx)      cls += ' opt-correct'
            else if (idx === selected)   cls += ' opt-wrong'
            else                         cls += ' opt-dim'
          }
          return (
            <button key={idx} className={cls} onClick={() => handleAnswer(idx)}>
              {opt}
            </button>
          )
        })}
      </div>

      {/* Feedback + Next */}
      {selected !== null && (
        <div className="feedback-row">
          <span className={selected === correctIdx ? 'fb-correct' : 'fb-wrong'}>
            {selected === correctIdx ? i18n.terms.correct : i18n.terms.wrong}
          </span>
          <button className="btn-primary" onClick={handleNext}>
            {i18n.terms.next}
          </button>
        </div>
      )}

      <button className="btn-ghost" onClick={() => setMode(null)}>
        ← {i18n.terms.back}
      </button>
    </div>
  )
}
