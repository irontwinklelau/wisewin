import { useState, useEffect } from 'react'

const API = 'http://localhost:8090/api'

const LEVEL_LABELS = ['零', '壹', '贰', '叁', '肆']

function App() {
  const [view, setView] = useState('dashboard')
  const [user, setUser] = useState({ level: 0, streak_days: 0, total_checkins: 0, weapon_count: 0 })
  const [weapons, setWeapons] = useState([])
  const [lesson, setLesson] = useState(null)
  const [levelTest, setLevelTest] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { refreshUser() }, [])

  const refreshUser = () => {
    fetch(`${API}/training/user`).then(r => r.json()).then(data => setUser(data)).catch(() => {})
  }

  const loadToday = async () => {
    setLoading(true); setError(null)
    try {
      // 先检查是否有升级测验
      const statusR = await fetch(`${API}/training/level-up-status`)
      const status = await statusR.json()
      if (status.can_test) {
        setLevelTest(status)
        setView('level-test')
        setLoading(false)
        return
      }
      // 否则加载今日训练
      const r = await fetch(`${API}/training/today`)
      const data = await r.json()
      if (data.status === 'ok') { setLesson(data.lesson); setUser(data.user); setView('lesson-1') }
      else { setError(data.message || 'No content') }
    } catch { setError('Cannot connect to server. Run start.bat first.') }
    setLoading(false)
  }

  const submitLevelTest = async () => {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const r = await fetch(`${API}/training/level-up-test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      })
      const data = await r.json()
      if (data.passed) {
        setUser(prev => ({ ...prev, level: data.new_level }))
        setView('level-up')
      } else {
        setError(data.reason || '请再试一次')
      }
    } catch { setError('提交失败') }
    setLoading(false)
  }

  const submitExercise = async () => {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const r = await fetch(`${API}/training/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lesson.id, answer }),
      })
      const data = await r.json()
      if (data.status === 'ok') {
        setUser(prev => ({ ...prev, streak_days: data.streak_days, total_checkins: data.total_checkins, weapon_count: data.weapon_count }))
        setView('success')
      } else if (data.status === 'already_checked_in') { setError('Already checked in today') }
    } catch { setError('Submit failed') }
    setLoading(false)
  }

  const goHome = () => { setView('dashboard'); setLesson(null); setAnswer(''); setError(null); refreshUser() }

  const loadWeapons = async () => {
    try {
      const r = await fetch(`${API}/training/weapons`)
      const data = await r.json()
      setWeapons(data.weapons || [])
      setView('weapons')
    } catch { setError('Failed to load weapons') }
  }

  return (
    <>
      {view === 'dashboard' && <Dashboard user={user} loading={loading} error={error} onStart={loadToday} onWeapons={loadWeapons} />}
      {view === 'level-test' && levelTest && <LevelTestScreen test={levelTest} answer={answer} setAnswer={setAnswer} loading={loading} error={error} onSubmit={submitLevelTest} onHome={goHome} />}
      {view === 'level-up' && <LevelUpCelebration user={user} onHome={goHome} />}
      {view === 'weapons' && <WeaponsView weapons={weapons} onHome={goHome} />}
      {view === 'lesson-1' && lesson && <LessonConcept lesson={lesson} step={1} onNext={() => setView('lesson-2')} onHome={goHome} />}
      {view === 'lesson-2' && lesson && <LessonBreakdown lesson={lesson} step={2} onNext={() => setView('lesson-3')} onHome={goHome} />}
      {view === 'lesson-3' && lesson && <LessonExercise lesson={lesson} step={3} answer={answer} setAnswer={setAnswer} loading={loading} onSubmit={submitExercise} onHome={goHome} />}
      {view === 'success' && <SuccessScreen user={user} lesson={lesson} onHome={goHome} />}
    </>
  )
}

// ═══════════ Dashboard ═══════════
function Dashboard({ user, loading, error, onStart, onWeapons }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, letterSpacing: '0.04em' }}>内功</span>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, padding: '48px 0 32px' }}>
        <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--accent)', opacity: 0.5 }} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px dashed var(--accent)', opacity: 0.35 }} />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 40, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1 }}>{LEVEL_LABELS[user.level]}</span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4, letterSpacing: '0.08em' }}>LV · {user.level}</span>
        </div>

        <div style={{ display: 'flex', gap: 48 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{user.streak_days}</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>连续打卡</div>
          </div>
          <div style={{ width: 1, background: 'var(--border-light)' }} />
          <div onClick={onWeapons} style={{ textAlign: 'center', cursor: 'pointer', transition: 'opacity 0.2s' }}>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{user.weapon_count}</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>武器库 →</div>
          </div>
        </div>

        {error && <div style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--warn)', fontSize: 14 }}>{error}</div>}
        <button onClick={onStart} disabled={loading} style={btnPrimaryStyle(loading)}>
          {loading ? 'Loading...' : '今日训练'}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <Divider text="训练路线图" />
      <RoadmapItem title="不被PUA · 受害者叙事觉察" active />
      <RoadmapItem title="不被PUA · 框架化表达" />
      <RoadmapItem title="不被PUA · 自我估值校准" />
    </div>
  )
}

// ═══════════ Weapons View ═══════════
function WeaponsView({ weapons, onHome }) {
  const byModule = {}
  weapons.forEach(w => {
    if (!byModule[w.module]) byModule[w.module] = []
    byModule[w.module].push(w)
  })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <TopBar onHome={onHome} subtitle={`武器库 · ${weapons.length} 件`} />
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700 }}>知识武器库</div>
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>你掌握的每一个框架，都是一件武器。它们会在你需要的时候自动浮现。</div>

      {weapons.length === 0 && (
        <Card><p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>武器库还是空的。完成第一次训练来获得你的第一件武器。</p></Card>
      )}

      {Object.entries(byModule).map(([module, items]) => (
        <div key={module} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{module}</div>
          {items.map(w => (
            <div key={w.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px',
              display: 'flex', gap: 16, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>🗡️</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{w.name}</div>
                {w.definition && <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>{w.definition}</div>}
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                  {w.acquired_at ? new Date(w.acquired_at).toLocaleDateString('zh-CN') : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      <button onClick={onHome} style={btnGhostStyle}>← 回到首页</button>
    </div>
  )
}

// ═══════════ Lesson Screens (unchanged from v0.2.0) ═══════════
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
      <div style={{ alignSelf: 'flex-end' }}><Btn onClick={onNext}>继续 · 拆解案例</Btn></div>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <CompareBox label="面试官听到的" tone="bad">{c.case.what_he_heard.map((item, i) => <p key={i} style={{ marginBottom: 8 }}>{item}</p>)}</CompareBox>
        <CompareBox label="面试官想听到的" tone="good">{c.case.what_he_wanted.map((item, i) => <p key={i} style={{ marginBottom: 8 }}>{item}</p>)}</CompareBox>
      </div>
      <Card title="💡 关键洞察">{c.case.deep_insight.split('\n\n').map((p, i) => <p key={i} style={{ marginBottom: i === 0 ? 12 : 0 }}>{p}</p>)}</Card>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Tag pitfall>🕳️ 受害者叙事</Tag><Tag>交叉验证</Tag><Tag>叙事框架</Tag><Tag>面试策略</Tag>
      </div>
      <div style={{ alignSelf: 'flex-end' }}><Btn onClick={onNext}>继续 · 开始练习</Btn></div>
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
        <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder={c.exercise.placeholder}
          style={{ width: '100%', minHeight: 200, padding: '20px 24px', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.8, color: 'var(--text)', background: 'var(--surface)', resize: 'vertical', outline: 'none' }} />
        <span style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>{answer.length} 字</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        不用写完美。框架化表达本身就是练习——说清楚比说漂亮重要。
      </div>
      <div style={{ alignSelf: 'flex-end' }}><Btn onClick={onSubmit} disabled={loading || !answer.trim()}>{loading ? '提交中...' : '提交 · 完成打卡'}</Btn></div>
    </div>
  )
}

function SuccessScreen({ user, lesson, onHome }) {
  const c = lesson?.content
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0 48px', gap: 32 }}>
      <div className="animate-badge-in" style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #E0A060)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#FFF', fontSize: 40 }}>✓</span>
      </div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, letterSpacing: '0.02em' }}>训练完成</div>
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.8 }}>
        连续打卡 <strong style={{ color: 'var(--text)' }}>{user.streak_days}</strong> 天<br />
        武器库 <strong style={{ color: 'var(--text)' }}>+1</strong>（共 {user.weapon_count} 件）
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 24, background: 'var(--accent-soft)', fontSize: 14 }}>
        <span style={{ fontSize: 18 }}>🗡️</span><span>{lesson?.module} · {lesson?.title} 已加入武器库</span>
      </div>
      {c?.next_preview && (
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.8 }}>
          明天的训练主题<br /><span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text)' }}>"{c.next_preview}"</span>
        </div>
      )}
      <button onClick={onHome} style={btnGhostStyle}>回到首页</button>
    </div>
  )
}

// ═══════════ Level Test ═══════════
function LevelTestScreen({ test, answer, setAnswer, loading, error, onSubmit, onHome }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <TopBar onHome={onHome} subtitle={`LV.${test.current_level} → LV.${test.next_level} 升级测验`} />
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700 }}>升段测验</div>
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        你已经完成了「{test.test.module}」模块的所有课程。现在需要通过一道测验来证明你已经内化了这些知识。
      </div>

      <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 10, padding: '24px 28px' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>升段考题</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.7 }}>{test.test.question}</div>
      </div>

      <div style={{ position: 'relative' }}>
        <textarea value={answer} onChange={e => setAnswer(e.target.value)}
          placeholder="写下你的回答..."
          style={{ width: '100%', minHeight: 180, padding: '20px 24px', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.8, color: 'var(--text)', background: 'var(--surface)', resize: 'vertical', outline: 'none' }} />
        <span style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>{answer.length} 字</span>
      </div>

      {error && <div style={{ padding: '8px 16px', borderRadius: 8, background: '#FFF4ED', color: 'var(--warn)', fontSize: 14 }}>{error}</div>}

      <div style={{ alignSelf: 'flex-end' }}>
        <Btn onClick={onSubmit} disabled={loading || !answer.trim()}>{loading ? '提交中...' : '提交答案 · 升段'}</Btn>
      </div>
    </div>
  )
}

function LevelUpCelebration({ user, onHome }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0 48px', gap: 32 }}>
      <div className="animate-badge-in" style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #F0C060, #E0A060)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 40, fontWeight: 700, color: '#FFF', lineHeight: 1 }}>{LEVEL_LABELS[user.level]}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em' }}>LV · {user.level}</div>
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, letterSpacing: '0.02em' }}>升段成功！</div>

      <div style={{ fontSize: 15, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.8 }}>
        你已从 <strong style={{ color: 'var(--text)' }}>LV.{user.level - 1}</strong> 升至 <strong style={{ color: 'var(--accent)' }}>LV.{user.level}</strong><br />
        新的训练内容已解锁
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {user.level >= 1 && <RoadmapItem title="不被PUA · 框架化表达" active />}
        {user.level >= 2 && <RoadmapItem title="不被PUA · 自我估值校准" active />}
        {user.level >= 3 && <RoadmapItem title="读人痛点" active />}
      </div>

      <button onClick={onHome} style={btnGhostStyle}>回到首页</button>
    </div>
  )
}

// ═══════════ Shared Components ═══════════
function TopBar({ onHome, subtitle }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
      <span onClick={onHome} style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer' }}>← 内功</span>
      <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{subtitle}</span>
    </div>
  )
}

function ProgressBar({ step, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 3, background: 'var(--border-light)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(step/total)*100}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{step} / {total}</span>
    </div>
  )
}

function Card({ title, children }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '28px 32px' }}>
    {title && <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{title}</div>}
    <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{children}</div>
  </div>
}

function Callout({ label, quote, source }) {
  return <div style={{ borderLeft: '3px solid var(--accent)', padding: '16px 20px', margin: '20px 0', background: 'var(--accent-soft)', borderRadius: '0 6px 6px 0' }}>
    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.7, color: 'var(--text)' }}>{quote}</div>
    {source && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>{source}</div>}
  </div>
}

function CompareBox({ label, tone, children }) {
  return <div style={{ border: '1px solid var(--border)', borderLeft: `3px solid ${tone === 'bad' ? '#C4A08A' : 'var(--success)'}`, borderRadius: 10, padding: '20px 24px' }}>
    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 600, color: tone === 'bad' ? '#C4A08A' : 'var(--success)' }}>{label}</div>
    <div style={{ fontSize: 15, lineHeight: 1.8 }}>{children}</div>
  </div>
}

function Tag({ pitfall, children }) {
  return <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, background: pitfall ? '#FFF4ED' : '#F5F4F1', color: pitfall ? '#C47A3A' : 'var(--text-secondary)', margin: '4px 4px 0 0' }}>{children}</span>
}

function Divider({ text }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-tertiary)', fontSize: 13 }}>
    <span style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />{text}<span style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
  </div>
}

function RoadmapItem({ title, active }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 24px', opacity: active ? 1 : 0.35, display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--text)' : 'var(--border)', flexShrink: 0 }} />
    <div><div style={{ fontSize: 15, fontWeight: 500 }}>{title}</div>{active && <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>今天解锁</div>}</div>
  </div>
}

function Btn({ onClick, disabled, children }) {
  return <button onClick={onClick} disabled={disabled} style={{
    display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px',
    background: 'var(--accent)', color: '#FFF', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1, transition: 'all 0.25s',
  }}>{children}<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
}

const btnPrimaryStyle = (loading) => ({
  display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 40px',
  background: 'var(--accent)', color: '#FFF', border: 'none', borderRadius: 10,
  fontSize: 16, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.02em',
  opacity: loading ? 0.7 : 1, transition: 'all 0.25s',
})

const btnGhostStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
  background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)',
  borderRadius: 6, fontSize: 14, cursor: 'pointer', alignSelf: 'center',
}

export default App
