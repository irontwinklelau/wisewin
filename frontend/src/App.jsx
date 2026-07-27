import { useState, useEffect } from 'react'

const API = 'http://localhost:8080/api'

// ═══════════ 段位标签映射 ═══════════
const LEVEL_LABELS = ['零', '壹', '贰', '叁', '肆']

function App() {
  const [view, setView] = useState('dashboard')
  const [user, setUser] = useState({ level: 0, streak_days: 0, total_checkins: 0, weapon_count: 0 })
  const [lesson, setLesson] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 加载用户状态
  useEffect(() => {
    fetch(`${API}/training/user`)
      .then(r => r.json())
      .then(data => setUser(data))
      .catch(() => {}) // 后端未启动时静默
  }, [])

  // 加载今日训练
  const loadToday = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`${API}/training/today`)
      const data = await r.json()
      if (data.status === 'ok') {
        setLesson(data.lesson)
        setUser(data.user)
        setView('lesson-1')
      } else {
        setError(data.message || '暂无训练内容')
      }
    } catch {
      setError('无法连接后端服务，请确认已启动 start.bat')
    }
    setLoading(false)
  }

  // 提交练习
  const submitExercise = async () => {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const r = await fetch(`${API}/training/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lesson.id, answer }),
      })
      const data = await r.json()
      if (data.status === 'ok') {
        setUser(prev => ({
          ...prev,
          streak_days: data.streak_days,
          total_checkins: data.total_checkins,
          weapon_count: data.weapon_count,
        }))
        setView('success')
      } else if (data.status === 'already_checked_in') {
        setError('今天已经打卡过了，明天再来吧')
      }
    } catch {
      setError('提交失败，请检查后端服务')
    }
    setLoading(false)
  }

  // 回到首页
  const goHome = () => {
    setView('dashboard')
    setLesson(null)
    setAnswer('')
    setError(null)
    fetch(`${API}/training/user`)
      .then(r => r.json())
      .then(data => setUser(data))
      .catch(() => {})
  }

  return (
    <>
      {view === 'dashboard' && (
        <Dashboard user={user} loading={loading} error={error} onStart={loadToday} />
      )}
      {view === 'lesson-1' && lesson && (
        <LessonConcept lesson={lesson} step={1} onNext={() => setView('lesson-2')} onHome={goHome} />
      )}
      {view === 'lesson-2' && lesson && (
        <LessonBreakdown lesson={lesson} step={2} onNext={() => setView('lesson-3')} onHome={goHome} />
      )}
      {view === 'lesson-3' && lesson && (
        <LessonExercise
          lesson={lesson}
          step={3}
          answer={answer}
          setAnswer={setAnswer}
          loading={loading}
          onSubmit={submitExercise}
          onHome={goHome}
        />
      )}
      {view === 'success' && (
        <SuccessScreen user={user} lesson={lesson} onHome={goHome} />
      )}
    </>
  )
}

// ═══════════ 子组件 ═══════════

function Dashboard({ user, loading, error, onStart }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* 顶栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, letterSpacing: '0.04em' }}>内功</span>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
      </div>

      {/* 段位 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, padding: '48px 0 32px' }}>
        <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--accent)', opacity: 0.5 }} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px dashed var(--accent)', opacity: 0.35 }} />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 40, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1 }}>{LEVEL_LABELS[user.level] || '零'}</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4, letterSpacing: '0.08em' }}>LV · {user.level}</span>
        </div>

        {/* 统计 */}
        <div style={{ display: 'flex', gap: 48 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{user.streak_days}</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>连续打卡</div>
          </div>
          <div style={{ width: 1, background: 'var(--border-light)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{user.weapon_count}</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>武器库</div>
          </div>
        </div>

        {/* CTA */}
        {error && (
          <div style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--warn)', fontSize: 14 }}>
            {error}
          </div>
        )}
        <button
          onClick={onStart}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 40px',
            background: 'var(--accent)', color: '#FFF', border: 'none', borderRadius: 10,
            fontSize: 16, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.02em',
            opacity: loading ? 0.7 : 1, transition: 'all 0.25s',
          }}
        >
          {loading ? '加载中...' : '今日训练'}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* 路线图 */}
      <Divider text="训练路线图" />
      <RoadmapItem title="不被PUA · 受害者叙事觉察" active />
      <RoadmapItem title="不被PUA · 框架化表达" />
      <RoadmapItem title="不被PUA · 自我估值校准" />
    </div>
  )
}

function LessonConcept({ lesson, step, onNext, onHome }) {
  const c = lesson.content
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <TopBar onHome={onHome} subtitle={`${lesson.module} · Day ${lesson.lesson_index}`} />
      <ProgressBar step={step} total={4} />
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, lineHeight: 1.4, letterSpacing: '0.02em' }}>{lesson.title}</div>
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.one_liner}</div>

      <Card title="核心概念">
        <p><strong>受害者叙事</strong>：{c.concept.victim}</p>
        <p style={{ marginTop: 12 }}><strong>策略选择者叙事</strong>：{c.concept.strategist}</p>
        <p style={{ marginTop: 16, fontSize: 14, color: 'var(--text-tertiary)' }}>{c.concept.key_insight}</p>
      </Card>

      <Callout label={`真实案例 · ${c.case.source}`} quote={`"${c.case.question}"`} source={`—— ${c.case.interviewer}`} />

      <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', padding: '0 4px' }}>
        当时你的回答：<br />
        <span style={{ color: 'var(--text)', fontWeight: 500 }}>"{c.case.your_answer}"</span><br /><br />
        这是一个典型的<strong>受害者叙事</strong>——"不是我选的，事情就这样发生了"。面试官听到的不是"我能解释我的职业选择逻辑"，而是"我很无奈"。
      </div>

      <div style={{ alignSelf: 'flex-end' }}>
        <Btn onClick={onNext}>继续 · 拆解案例</Btn>
      </div>
    </div>
  )
}

function LessonBreakdown({ lesson, step, onNext, onHome }) {
  const c = lesson.content
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <TopBar onHome={onHome} subtitle={`${lesson.module} · Day ${lesson.lesson_index}`} />
      <ProgressBar step={step} total={4} />
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700 }}>逐句拆解</div>
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>面试官的每一句话都有潜台词。你的每一句回答都在传递信号。</div>

      {/* 对比 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <CompareBox label="面试官听到的" tone="bad">
          {c.case.what_he_heard.map((item, i) => <p key={i} style={{ marginBottom: 8 }}>{item}</p>)}
        </CompareBox>
        <CompareBox label="面试官想听到的" tone="good">
          {c.case.what_he_wanted.map((item, i) => <p key={i} style={{ marginBottom: 8 }}>{item}</p>)}
        </CompareBox>
      </div>

      <Card title="💡 关键洞察">
        {c.case.deep_insight.split('\n\n').map((p, i) => <p key={i} style={{ marginBottom: i === 0 ? 12 : 0 }}>{p}</p>)}
      </Card>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Tag pitfall>🕳️ 受害者叙事</Tag>
        <Tag>交叉验证</Tag>
        <Tag>叙事框架</Tag>
        <Tag>面试策略</Tag>
      </div>

      <div style={{ alignSelf: 'flex-end' }}>
        <Btn onClick={onNext}>继续 · 开始练习</Btn>
      </div>
    </div>
  )
}

function LessonExercise({ lesson, step, answer, setAnswer, loading, onSubmit, onHome }) {
  const c = lesson.content
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <TopBar onHome={onHome} subtitle={`${lesson.module} · Day ${lesson.lesson_index}`} />
      <ProgressBar step={step} total={4} />

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '24px 28px' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 8 }}>今日练习</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.6, fontWeight: 600 }}>{c.exercise.question}</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.7 }}>
          不用回避事实。同样的经历，换一个框架来组织。<br />
          想想你在每个节点<strong>主动选择了什么</strong>、<strong>学到了什么</strong>、<strong>这个选择如何导向下一段经历</strong>。
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder={c.exercise.placeholder}
          style={{
            width: '100%', minHeight: 200, padding: '20px 24px',
            border: '1px solid var(--border)', borderRadius: 10,
            fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.8,
            color: 'var(--text)', background: 'var(--surface)',
            resize: 'vertical', outline: 'none',
          }}
        />
        <span style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>
          {answer.length} 字
        </span>
      </div>

      <div style={HintStyle}>不用写完美。框架化表达本身就是练习——说清楚比说漂亮重要。</div>

      <div style={{ alignSelf: 'flex-end' }}>
        <Btn onClick={onSubmit} disabled={loading || !answer.trim()}>
          {loading ? '提交中...' : '提交 · 完成打卡'}
        </Btn>
      </div>
    </div>
  )
}

function SuccessScreen({ user, lesson, onHome }) {
  const c = lesson?.content
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0 48px', gap: 32 }}>
      <div className="animate-badge-in" style={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent), #E0A060)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#FFF', fontSize: 40 }}>✓</span>
      </div>

      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, letterSpacing: '0.02em' }}>训练完成</div>

      <div style={{ fontSize: 15, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.8 }}>
        连续打卡 <strong style={{ color: 'var(--text)' }}>{user.streak_days}</strong> 天<br />
        武器库 <strong style={{ color: 'var(--text)' }}>+1</strong>（共 {user.weapon_count} 件）
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
        borderRadius: 24, background: 'var(--accent-soft)', fontSize: 14,
      }}>
        <span style={{ fontSize: 18 }}>🗡️</span>
        <span>{lesson?.module} · {lesson?.title} 已加入武器库</span>
      </div>

      {c?.next_preview && (
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.8 }}>
          明天的训练主题<br />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text)' }}>"{c.next_preview}"</span>
        </div>
      )}

      <button onClick={onHome} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
        background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)',
        borderRadius: 6, fontSize: 14, cursor: 'pointer',
      }}>
        回到首页
      </button>
    </div>
  )
}

// ═══════════ 通用小组件 ═══════════

function TopBar({ onHome, subtitle }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
      <span onClick={onHome} style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer' }}>← 内功</span>
      <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{subtitle}</span>
    </div>
  )
}

function ProgressBar({ step, total }) {
  const pct = (step / total) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 3, background: 'var(--border-light)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{step} / {total}</span>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '28px 32px' }}>
      {title && <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{title}</div>}
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

function Callout({ label, quote, source }) {
  return (
    <div style={{ borderLeft: '3px solid var(--accent)', padding: '16px 20px', margin: '20px 0', background: 'var(--accent-soft)', borderRadius: '0 6px 6px 0' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.7, color: 'var(--text)' }}>{quote}</div>
      {source && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>{source}</div>}
    </div>
  )
}

function CompareBox({ label, tone, children }) {
  const borderColor = tone === 'bad' ? '#C4A08A' : 'var(--success)'
  const labelColor = tone === 'bad' ? '#C4A08A' : 'var(--success)'
  return (
    <div style={{ border: `1px solid var(--border)`, borderLeft: `3px solid ${borderColor}`, borderRadius: 10, padding: '20px 24px' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 600, color: labelColor }}>{label}</div>
      <div style={{ fontSize: 15, lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

function Tag({ pitfall, children }) {
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12,
      background: pitfall ? '#FFF4ED' : '#F5F4F1',
      color: pitfall ? '#C47A3A' : 'var(--text-secondary)',
      margin: '4px 4px 0 0',
    }}>{children}</span>
  )
}

function Divider({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-tertiary)', fontSize: 13 }}>
      <span style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
      {text}
      <span style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
    </div>
  )
}

function RoadmapItem({ title, active }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 24px',
      opacity: active ? 1 : 0.35, display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--text)' : 'var(--border)', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{title}</div>
        {active && <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>今天解锁</div>}
      </div>
    </div>
  )
}

function Btn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px',
      background: 'var(--accent)', color: '#FFF', border: 'none', borderRadius: 10,
      fontSize: 14, fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition: 'all 0.25s',
    }}>
      {children}
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  )
}

const HintStyle = {
  fontSize: 13, color: 'var(--text-tertiary)', marginTop: 8,
  display: 'flex', alignItems: 'center', gap: 6,
}

export default App
