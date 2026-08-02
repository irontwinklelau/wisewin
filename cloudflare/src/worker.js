// ── 内功 API Worker v1.2 ──
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } })
}

function today() { const d=new Date();const bj=new Date(d.getTime()+8*3600000);return bj.toISOString().slice(0,10) }
function yesterday() { const d=new Date(Date.now()-86400000);const bj=new Date(d.getTime()+8*3600000);return bj.toISOString().slice(0,10) }

const LEVEL_LABELS = ['零', '壹', '贰', '叁', '肆']

const LEVEL_TESTS = {
  0: {
    question: '请用一句话总结「受害者叙事」和「策略选择者叙事」的核心区别，并举例说明你在什么场景下容易陷入受害者叙事。',
    module: '不被PUA',
    evalPrompt: `你是一个博弈能力教练。学员刚学完"受害者叙事 vs 策略选择者叙事"这节课。请评估以下作业：

评估标准：
1. 是否准确说出了两种叙事的核心区别（受害者=被动承受，策略选择者=主动选择）
2. 是否举出了一个具体、真实的个人场景
3. 是否展示了自我觉察（不是泛泛而谈）

请用JSON格式回复：
{
  "passed": true/false,
  "score": 1-10,
  "strengths": "做得好的地方（1-2句）",
  "weaknesses": "可以改进的地方（1-2句）",
  "coach_note": "教练的一句话点评，鼓励但有建设性"
}

如果答案浮于表面、没有真实案例、或者明显没理解概念，给 passed: false。`
  },
  1: {
    question: '请用「框架化表达」的方法，重新组织你最近一次被问到"你的优势是什么"时的回答。',
    module: '框架化表达',
    evalPrompt: `你是一个博弈能力教练。学员刚学完"框架化表达"模块。请评估以下作业：

评估标准：
1. 是否使用了结构化框架（如STAR、金字塔等）来组织回答
2. 是否有具体的证据/数字支撑
3. 是否从"动作罗列"升级到了"逻辑链条"

请用JSON格式回复：
{
  "passed": true/false,
  "score": 1-10,
  "strengths": "做得好的地方",
  "weaknesses": "可以改进的地方",
  "coach_note": "教练的一句话点评"
}

如果答案仍然是散乱的动作罗列、没有框架、或者只是换了说法但没换结构，给 passed: false。`
  },
}

// ── AI 批改 ──
async function evaluateAnswer(level, answer, env) {
  if (!env.DEEPSEEK_API_KEY) return { passed: true, score: 5, strengths: '', weaknesses: '', coach_note: '（AI 批改未配置，手动通过）' }

  const test = LEVEL_TESTS[level]
  if (!test) return { passed: true, score: 5, coach_note: '已完成' }

  try {
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 500,
        messages: [
          { role: 'system', content: test.evalPrompt },
          { role: 'user', content: `学员作业：\n\n${answer}` },
        ],
      }),
    })
    const data = await resp.json()
    const text = data.choices[0].message.content.trim()
    // 解析 JSON（可能包裹在 markdown 代码块里）
    let jsonStr = text
    if (text.startsWith('```')) jsonStr = text.split('\n').slice(1, -1).join('\n')
    return JSON.parse(jsonStr)
  } catch (e) {
    return { passed: true, score: 5, strengths: '', weaknesses: '', coach_note: `（AI 评估暂时不可用：${e.message}）` }
  }
}

// ── 日常练习 AI 点评 ──
async function reviewExercise(module, lessonIndex, answer, env) {
  if (!env.DEEPSEEK_API_KEY) return null

  try {
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 400,
        messages: [
          { role: 'system', content: `你是一个博弈能力教练。学员刚完成了「${module}」模块第${lessonIndex}课的练习。请用2-3句话点评他的作业：指出一个亮点、一个可以深挖的方向。口吻是教练式的——真诚、有洞察力、不空洞。` },
          { role: 'user', content: answer },
        ],
      }),
    })
    const data = await resp.json()
    return data.choices[0].message.content.trim()
  } catch { return null }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname
    const db = env.DB

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    try {
      // Health
      if (path === '/api/health') return json({ status: 'ok', version: '1.2.0' })

      // User status
      if (path === '/api/training/user') {
        let user = await db.prepare('SELECT * FROM user_state WHERE id = 1').first()
        if (!user) {
          await db.prepare('INSERT INTO user_state (id, level, streak_days, total_checkins) VALUES (1,0,0,0)').run()
          user = { level: 0, streak_days: 0, total_checkins: 0, last_checkin_date: null }
        }
        const { count: weapon_count } = await db.prepare('SELECT COUNT(*) as count FROM weapons').first()
        return json({ level: user.level, streak_days: user.streak_days, total_checkins: user.total_checkins, weapon_count, last_checkin_date: user.last_checkin_date })
      }

      // Today's training
      if (path === '/api/training/today') {
        try {
        let user = await db.prepare('SELECT * FROM user_state WHERE id = 1').first()
        if (!user) {
          await db.prepare('INSERT INTO user_state (id, level, streak_days, total_checkins) VALUES (1,0,0,0)').run()
          user = { level: 0, streak_days: 0, total_checkins: 0 }
        }
        const td = today()
        if (user.last_checkin_date === td) {
          return json({ status: 'already_checked_in', message: '今天已经训练过了，明天再来', user: { level: user.level, streak_days: user.streak_days, total_checkins: user.total_checkins } })
        }
        const all = await db.prepare('SELECT COUNT(*) as c FROM lessons').first()
        const count = Number(all?.c || 0)
        const offset = count > 0 ? (user.total_checkins || 0) % count : 0
        const lesson = await db.prepare('SELECT * FROM lessons ORDER BY module, lesson_index LIMIT 1 OFFSET ?').bind(offset).first()
        if (!lesson) return json({ status: 'no_content', message: '暂无课程，请先初始化种子数据', user: { level: user.level, streak_days: user.streak_days, total_checkins: user.total_checkins } })
        return json({
          status: 'ok',
          lesson: { id: lesson.id, module: lesson.module, lesson_index: lesson.lesson_index, title: lesson.title, content: JSON.parse(lesson.content_json) },
          user: { level: user.level, streak_days: user.streak_days, total_checkins: user.total_checkins },
        })
        } catch(e) { return json({ error: 'today endpoint error: '+e.message }, 500) }
      }

      // Submit exercise + AI review
      if (path === '/api/training/submit' && request.method === 'POST') {
        const body = await request.json()
        const { lesson_id, answer } = body
        let user = await db.prepare('SELECT * FROM user_state WHERE id = 1').first()
        if (!user) { await db.prepare('INSERT INTO user_state (id, level, streak_days, total_checkins) VALUES (1,0,0,0)').run(); user = { level:0, streak_days:0, total_checkins:0, last_checkin_date:null } }

        const td = today()
        if (user.last_checkin_date === td) return json({ status: 'already_checked_in', message: '今天已经打卡过了' })

        let streak = user.streak_days
        if (user.last_checkin_date) {
          if (user.last_checkin_date === yesterday()) streak++
          else if (user.last_checkin_date !== td) streak = 1
        } else streak = 1

        const lesson = await db.prepare('SELECT * FROM lessons WHERE id = ?').bind(lesson_id).first()
        if (!lesson) return json({ error: 'Lesson not found' }, 404)

        const lc = JSON.parse(lesson.content_json)
        const weaponName = `${lesson.module} · ${lesson.title}`

        // AI 点评
        const review = await reviewExercise(lesson.module, lesson.lesson_index, answer, env)

        await db.prepare('UPDATE user_state SET streak_days=?, last_checkin_date=?, total_checkins=total_checkins+1 WHERE id=1').bind(streak, td).run()
        await db.prepare('INSERT INTO training_logs (date, module, lesson_index, exercise_answer, completed) VALUES (?,?,?,?,1)').bind(td, lesson.module, lesson.lesson_index, answer).run()

        const existing = await db.prepare('SELECT id FROM weapons WHERE module=? AND lesson_index=?').bind(lesson.module, lesson.lesson_index).first()
        if (!existing) {
          await db.prepare('INSERT OR IGNORE INTO weapons (name, definition, module, lesson_index, acquired_at) VALUES (?,?,?,?,?)').bind(weaponName, lc.one_liner || '', lesson.module, lesson.lesson_index, new Date().toISOString()).run()
        }

        const { count: wc } = await db.prepare('SELECT COUNT(*) as count FROM weapons').first()
        return json({ status: 'ok', streak_days: streak, total_checkins: user.total_checkins + 1, weapon_count: wc, weapon_name: weaponName, review })
      }

      // Training history
      if (path === '/api/training/history') {
        const { results } = await db.prepare(`
          SELECT tl.*, l.title as lesson_title, l.content_json
          FROM training_logs tl
          LEFT JOIN lessons l ON tl.module = l.module AND tl.lesson_index = l.lesson_index
          WHERE tl.completed = 1
          ORDER BY tl.date DESC, tl.id DESC
        `).all()
        return json({ count: results.length, logs: results.map(r => ({
          ...r,
          content_json: r.content_json ? JSON.parse(r.content_json) : null,
        }))})
      }

      // History detail — AI gap analysis
      if (path === '/api/training/history/compare' && request.method === 'POST') {
        const body = await request.json()
        const { log_id } = body
        const log = await db.prepare(`
          SELECT tl.*, l.title as lesson_title, l.content_json
          FROM training_logs tl
          LEFT JOIN lessons l ON tl.module = l.module AND tl.lesson_index = l.lesson_index
          WHERE tl.id = ?
        `).bind(log_id).first()
        if (!log) return json({ error: 'Not found' }, 404)

        let analysis = null
        const lc = JSON.parse(log.content_json || '{}')
        const question = lc.exercise?.question || lc.one_liner || log.lesson_title

        // 先查缓存
        if (log.analysis_json) {
          try { analysis = JSON.parse(log.analysis_json) } catch {}
        }

        // 缓存未命中，调用 AI
        if (!analysis && env.DEEPSEEK_API_KEY) {
          try {
            const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
              body: JSON.stringify({
                model: 'deepseek-chat',
                max_tokens: 600,
                messages: [{
                  role: 'system',
                  content: `你是一个博弈能力教练。学员之前完成了一道训练题，现在他回来回顾。请做以下分析：

## 评分（100分制）
按以下四个维度打分，每个维度25分：

1. 框架运用（25分）：是否使用了课程所教的思维框架来组织回答？还是散乱的动作罗列？
2. 自我觉察（25分）：是否展示了真实的自我反思？还是泛泛而谈？
3. 具体证据（25分）：是否有具体的场景/数字/案例支撑？还是空话套话？
4. 叙事升级（25分）：是否从"被动承受者"叙事升级到"策略选择者"叙事？

给出总分和每个维度的得分，以及每个维度的扣分理由（一句话）。

## 差距分析
1. 指出他的回答和"理想回答"之间的本质差距（思维框架层面的差距）
2. 用1-2个具体例子说明"如果是高阶选手，会怎么想/怎么说"
3. 给出一条他下次遇到类似场景时可以执行的"行动清单"

请用以下JSON格式回复：
{
  "total_score": 72,
  "scoring": {
    "framework": { "score": 18, "max": 25, "comment": "使用了STAR框架但有头无尾" },
    "awareness": { "score": 20, "max": 25, "comment": "展示了一定的自我反思" },
    "evidence": { "score": 15, "max": 25, "comment": "缺少具体数字和场景" },
    "narrative": { "score": 19, "max": 25, "comment": "部分从被动转向主动" }
  },
  "core_gap": "本质差距的一句话总结",
  "their_approach": "他当时是怎么回答的（思维模式概括）",
  "better_approach": "更好的回答应该体现什么思维模式",
  "example": "一个具体的'高阶回答'演示",
  "action_items": ["下次注意点1", "下次注意点2", "下次注意点3"]
}`,
                }, {
                  role: 'user',
                  content: `题目：${question}\n\n学员的回答：${log.exercise_answer || '(空)'}`,
                }],
              }),
            })
            const data = await resp.json()
            const text = data.choices[0].message.content.trim()
            let jsonStr = text
            if (text.startsWith('```')) jsonStr = text.split('\n').slice(1, -1).join('\n')
            analysis = JSON.parse(jsonStr)
            // 缓存到数据库
            await db.prepare('UPDATE training_logs SET analysis_json = ? WHERE id = ?').bind(JSON.stringify(analysis), log.id).run()
          } catch (e) { analysis = { error: e.message } }
        }

        // 重新查询（可能已更新 analysis_json）
        if (!analysis) {
          const updated = await db.prepare('SELECT analysis_json FROM training_logs WHERE id = ?').bind(log.id).first()
          if (updated?.analysis_json) { try { analysis = JSON.parse(updated.analysis_json) } catch {} }
        }

        return json({
          log: {
            id: log.id, date: log.date, module: log.module,
            lesson_title: log.lesson_title, question,
            answer: log.exercise_answer,
          },
          analysis,
        })
      }

      // Weapons
      if (path === '/api/training/weapons') {
        const { results } = await db.prepare('SELECT * FROM weapons ORDER BY acquired_at DESC').all()
        return json({ count: results.length, weapons: results })
      }

      // Level-up status
      if (path === '/api/training/level-up-status') {
        const user = await db.prepare('SELECT * FROM user_state WHERE id = 1').first()
        if (!user) return json({ can_test: false, reason: 'not initialized' })

        const modules = ['不被PUA', '不被PUA', '不被PUA', '读人痛点']
        const currentModule = modules[user.level] || null
        if (!currentModule) return json({ can_test: false, reason: '已达最高段位' })

        const { count: completed } = await db.prepare('SELECT COUNT(*) as count FROM training_logs WHERE module=? AND completed=1').bind(currentModule).first()
        const { count: total } = await db.prepare('SELECT COUNT(*) as count FROM lessons WHERE module=?').bind(currentModule).first()

        if (total === 0) return json({ can_test: false, reason: '当前模块暂无课程' })
        if (completed < total) return json({ can_test: false, reason: `还需完成 ${total - completed} 节课` })

        const test = LEVEL_TESTS[user.level]
        if (!test) return json({ can_test: false, reason: '测验未配置' })
        const { question, module } = test
        return json({ can_test: true, current_level: user.level, next_level: user.level + 1, test: { question, module } })
      }

      // Level-up test submit — AI 批改
      if (path === '/api/training/level-up-test' && request.method === 'POST') {
        const body = await request.json()
        const user = await db.prepare('SELECT * FROM user_state WHERE id = 1').first()
        if (!user) return json({ error: 'not initialized' }, 404)

        const test = LEVEL_TESTS[user.level]
        if (!test) return json({ passed: false, reason: '无测验配置' })

        if ((body.answer || '').length < 10) return json({ passed: false, reason: '写得太少了，再想想？', review: null })

        // AI 批改
        const evaluation = await evaluateAnswer(user.level, body.answer, env)

        // 保存测验答案到训练记录
        const testModule = test.module || '升段测验'
        await db.prepare('INSERT INTO training_logs (date, module, lesson_index, exercise_answer, completed) VALUES (?,?,?,?,1)').bind(today(), testModule, user.level + 1, body.answer).run()

        if (evaluation.passed) {
          await db.prepare('UPDATE user_state SET level = level + 1 WHERE id = 1').run()
          const newLevel = user.level + 1
          return json({
            passed: true,
            new_level: newLevel,
            level_label: LEVEL_LABELS[newLevel] || String(newLevel),
            score: evaluation.score,
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
            coach_note: evaluation.coach_note,
          })
        } else {
          return json({
            passed: false,
            reason: evaluation.coach_note || '还需要再练练',
            score: evaluation.score,
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
            coach_note: evaluation.coach_note,
          })
        }
      }

      // ── 打卡网格数据 ──
      if (path === '/api/training/checkin-grid') {
        const { results } = await db.prepare(`SELECT DISTINCT date FROM training_logs WHERE completed = 1 ORDER BY date`).all()
        return json({ dates: results.map(r => r.date) })
      }

      // ── 每日语录（缓存不重复生成）──
      if (path === '/api/training/daily-quote') {
        const td = today()
        const cached = await db.prepare('SELECT quote, source FROM daily_quotes WHERE date = ?').bind(td).first()
        if (cached) return json({ date: td, quote: cached.quote, source: cached.source, cached: true })

        // 当天还没有语录，生成一条
        let quote = null
        if (env.DEEPSEEK_API_KEY) {
          try {
            const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
              body: JSON.stringify({
                model: 'deepseek-chat', max_tokens: 200,
                messages: [{
                  role: 'system',
                  content: `你是一位智者。请给一位正在每天坚持训练自己商业博弈能力的学习者一句励志语录。要求：
- 有深度，不鸡汤
- 出处来自真实的历史人物/企业家/哲学家/军事家（如孙子、芒格、拿破仑、宫本武藏等）
- 语录长度不超过50字
- 用JSON格式回复：{"quote": "语录内容", "source": "出处（人名+头衔，如'查理·芒格，伯克希尔副董事长'）"}`,
                }],
              }),
            })
            const data = await resp.json()
            const text = data.choices[0].message.content.trim()
            let js = text; if (text.startsWith('```')) js = text.split('\n').slice(1, -1).join('\n')
            quote = JSON.parse(js)
            // 存入数据库
            await db.prepare('INSERT OR IGNORE INTO daily_quotes (date, quote, source) VALUES (?,?,?)').bind(td, quote.quote, quote.source).run()
          } catch {}
        }
        if (!quote) quote = { quote: '每天进步一点点，时间会给你答案。', source: '佚名' }
        return json({ date: td, quote: quote.quote, source: quote.source, cached: false })
      }

      // ── 课程大纲+进度 ──
      if (path === '/api/training/roadmap') {
        const lessons = await db.prepare('SELECT module, lesson_index, title FROM lessons ORDER BY module, lesson_index').all()
        const logs = await db.prepare('SELECT DISTINCT module, lesson_index FROM training_logs WHERE completed = 1').all()
        const done = new Set(logs.results.map(r => `${r.module}|${r.lesson_index}`))
        const modules = []
        let currentModule = null
        for (const l of lessons.results) {
          if (l.module !== currentModule) {
            currentModule = l.module
            modules.push({ module: l.module, lessons: [], completed: 0, total: 0 })
          }
          const m = modules[modules.length - 1]
          const key = `${l.module}|${l.lesson_index}`
          const isDone = done.has(key)
          m.lessons.push({ lesson_index: l.lesson_index, title: l.title, completed: isDone })
          m.total++
          if (isDone) m.completed++
        }
        return json({ modules })
      }

      // ── 跨境课程：列表（不限打卡）──
      if (path === '/api/training/courses') {
        const module = url.searchParams.get('module') || '跨境·看价格'
        const { results } = await db.prepare('SELECT * FROM lessons WHERE module = ? ORDER BY lesson_index').bind(module).all()
        if (!results.length) return json({ module, lessons: [], message: '暂无课程' })
        const logs = await db.prepare('SELECT DISTINCT lesson_index FROM training_logs WHERE module = ? AND completed = 1').bind(module).all()
        const done = new Set(logs.results.map(r => r.lesson_index))
        return json({
          module,
          lessons: results.map(l => ({
            id: l.id, lesson_index: l.lesson_index, title: l.title,
            content: JSON.parse(l.content_json), completed: done.has(l.lesson_index)
          }))
        })
      }

      // ── 跨境课程：提交（不限打卡，可重复练习）──
      if (path === '/api/training/course-submit' && request.method === 'POST') {
        const body = await request.json()
        const { lesson_id, answer } = body
        const lesson = await db.prepare('SELECT * FROM lessons WHERE id = ?').bind(lesson_id).first()
        if (!lesson) return json({ error: 'Lesson not found' }, 404)

        const lc = JSON.parse(lesson.content_json)
        const td = today()

        // AI 点评（使用课程专属 prompt）
        let review = null
        if (env.DEEPSEEK_API_KEY) {
          try {
            const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
              body: JSON.stringify({
                model: 'deepseek-chat', max_tokens: 400,
                messages: [{
                  role: 'system',
                  content: `你是一个跨境能源硬件选品教练。学员正在学习「${lesson.module}」模块，刚完成了第${lesson.lesson_index}课「${lesson.title}」的练习。请用2-3句话点评：指出一个做得好的点、一个可以做得更好的方向。口吻是教练式的——专业、具体、有建设性，不空洞。如果回答字数太少（<20字）或者明显没认真做，直接指出。`,
                }, {
                  role: 'user', content: `题目：${lc.exercise?.question || lc.one_liner}\n\n学员回答：${answer}`,
                }],
              }),
            })
            const data = await resp.json()
            review = data.choices[0].message.content.trim()
          } catch { review = null }
        }

        // 记录训练（不限打卡）
        await db.prepare('INSERT INTO training_logs (date, module, lesson_index, exercise_answer, completed) VALUES (?,?,?,?,1)').bind(td, lesson.module, lesson.lesson_index, answer).run()

        // 武器库
        const weaponName = `${lesson.module} · ${lesson.title}`
        const existing = await db.prepare('SELECT id FROM weapons WHERE module=? AND lesson_index=?').bind(lesson.module, lesson.lesson_index).first()
        if (!existing) {
          await db.prepare('INSERT OR IGNORE INTO weapons (name, definition, module, lesson_index, acquired_at) VALUES (?,?,?,?,?)').bind(weaponName, lc.one_liner || '', lesson.module, lesson.lesson_index, new Date().toISOString()).run()
        }

        return json({ status: 'ok', module: lesson.module, lesson_title: lesson.title, review })
      }

      return json({ error: 'Not found' }, 404)
    } catch (e) {
      return json({ error: e.message }, 500)
    }
  },
}
