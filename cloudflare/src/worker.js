// ── 内功 API Worker v1.3 ──
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
    evalPrompt: '你是博弈能力教练。评估学员作业：1.是否说出了两种叙事核心区别 2.是否举了具体真实场景 3.是否有自我觉察。用JSON回复：{"passed":true/false,"score":1-10,"strengths":"亮点","weaknesses":"可改进","coach_note":"点评（鼓励为主）"}。宽松原则：有基本理解就给过。',
  },
  1: {
    question: '请用「框架化表达」的方法，重新组织你最近一次被问到"你的优势是什么"时的回答。',
    module: '框架化表达',
    evalPrompt: '你是博弈能力教练。评估学员的"框架化表达"作业。宽松原则（学员是新手，有结构感就给过）：1.回答是否有清晰结构/逻辑线？时间线、分层、对比都算——不要求说出框架名字 2.是否有具体证据/案例？3.是否从经历提炼出了能力？用JSON回复：{"passed":true/false,"score":1-10,"strengths":"亮点","weaknesses":"可改进","coach_note":"教练点评（鼓励为主）"}。有隐含结构就算过。',
  },
  2: {
    question: '请复盘你最近一次面对"利益冲突"时的处理方式：你当时是怎么想的，如果重来一次你会怎么做？',
    module: '利益博弈',
    evalPrompt: '你是博弈能力教练。评估学员的"利益博弈"反思作业。宽松原则：1.是否识别出了利益冲突方和各自的诉求 2.是否有"如果重来"的替代方案 3.是否展示了博弈思维而非道德评判。用JSON回复：{"passed":true/false,"score":1-10,"strengths":"","weaknesses":"","coach_note":""}。',
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
        max_tokens: 1000,
        messages: [
          { role: 'system', content: test.evalPrompt },
          { role: 'user', content: `学员作业：\n\n${answer}` },
        ],
      }),
    })
    const data = await resp.json()
    const text = data.choices[0].message.content.trim()
    let jsonStr = text
    if (text.startsWith('```')) jsonStr = text.split('\n').slice(1, -1).join('\n')
    return JSON.parse(jsonStr)
  } catch (e) {
    return { passed: true, score: 5, strengths: '', weaknesses: '', coach_note: `（AI 评估暂时不可用：${e.message}）` }
  }
}

// ── 日常练习 AI 点评 ──
async function reviewExercise(module, lessonIndex, answer, env) {
  if (!env.DEEPSEEK_API_KEY) return 'ERR:no_key'
  try {
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat', max_tokens: 400,
        messages: [
          { role: 'system', content: `你是教练。学员完成「${module}」第${lessonIndex}课。回复纯JSON（不要markdown包裹）：{"review":"点评","example":"标准答案50-100字"}` },
          { role: 'user', content: answer },
        ],
      }),
    })
    const data = await resp.json()
    if (!data.choices) return 'ERR:no_choices:' + JSON.stringify(data).slice(0,100)
    return data.choices[0].message.content.trim()
  } catch(e) { return 'ERR:' + e.message }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname
    const db = env.DB

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    try {
      // Health
      if (path === '/api/health') return json({ status: 'ok', version: '1.3.0', has_key: !!env.DEEPSEEK_API_KEY, key_len: (env.DEEPSEEK_API_KEY||'').length })

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
        // 找第一个未完成的课，全部完成则回到第一课
        let lesson = await db.prepare(
          "SELECT * FROM lessons l WHERE l.module NOT LIKE '%跨境%' AND l.module NOT LIKE '%升段%' AND NOT EXISTS (SELECT 1 FROM training_logs t WHERE t.module = l.module AND t.lesson_index = l.lesson_index AND t.completed=1) ORDER BY l.module, l.lesson_index LIMIT 1"
        ).first()
        if (!lesson) {
          lesson = await db.prepare("SELECT * FROM lessons WHERE module NOT LIKE '%跨境%' AND module NOT LIKE '%升段%' ORDER BY module, lesson_index LIMIT 1").first()
        }
        if (!lesson) return json({ status: 'no_content', message: '暂无课程', user: { level: user.level, streak_days: user.streak_days, total_checkins: user.total_checkins } })
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

        if (log.analysis_json) { try { analysis = JSON.parse(log.analysis_json) } catch {} }

        if (!analysis && env.DEEPSEEK_API_KEY) {
          try {
            const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
              body: JSON.stringify({
                model: 'deepseek-chat', max_tokens: 600,
                messages: [{
                  role: 'system',
                  content: '你是博弈能力教练。分析学员的历史作业。四个维度打分(各25分)：框架运用、自我觉察、具体证据、叙事升级。指出核心差距，给出高阶示范和行动清单。JSON格式：{"total_score":72,"scoring":{"framework":{"score":18,"max":25,"comment":"..."},"awareness":{},"evidence":{},"narrative":{}},"core_gap":"","their_approach":"","better_approach":"","example":"","action_items":[]}',
                }, {
                  role: 'user',
                  content: `题目：${question}\n\n学员回答：${log.exercise_answer || '(空)'}`,
                }],
              }),
            })
            const data = await resp.json()
            const text = data.choices[0].message.content.trim()
            let jsonStr = text
            if (text.startsWith('```')) jsonStr = text.split('\n').slice(1, -1).join('\n')
            analysis = JSON.parse(jsonStr)
            await db.prepare('UPDATE training_logs SET analysis_json = ? WHERE id = ?').bind(JSON.stringify(analysis), log.id).run()
          } catch (e) { analysis = { error: e.message } }
        }

        if (!analysis) {
          const updated = await db.prepare('SELECT analysis_json FROM training_logs WHERE id = ?').bind(log.id).first()
          if (updated?.analysis_json) { try { analysis = JSON.parse(updated.analysis_json) } catch {} }
        }

        return json({ log: { id: log.id, date: log.date, module: log.module, lesson_title: log.lesson_title, question, answer: log.exercise_answer }, analysis })
      }

      if (path === '/api/training/weapons') {
        const { results } = await db.prepare('SELECT * FROM weapons ORDER BY acquired_at DESC').all()
        return json({ count: results.length, weapons: results })
      }

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

      if (path === '/api/training/level-up-test' && request.method === 'POST') {
        const body = await request.json()
        const user = await db.prepare('SELECT * FROM user_state WHERE id = 1').first()
        if (!user) return json({ error: 'not initialized' }, 404)
        const test = LEVEL_TESTS[user.level]
        if (!test) return json({ passed: false, reason: '无测验配置' })
        if ((body.answer || '').length < 10) return json({ passed: false, reason: '写得太少了，再想想？' })
        const evaluation = await evaluateAnswer(user.level, body.answer, env)
        const testModule = test.module || '升段测验'
        await db.prepare('INSERT INTO training_logs (date, module, lesson_index, exercise_answer, completed) VALUES (?,?,?,?,1)').bind(today(), testModule, user.level + 1, body.answer).run()
        if (evaluation.passed) {
          await db.prepare('UPDATE user_state SET level = level + 1 WHERE id = 1').run()
          return json({ passed: true, new_level: user.level + 1, level_label: LEVEL_LABELS[user.level + 1] || String(user.level + 1), score: evaluation.score, strengths: evaluation.strengths, weaknesses: evaluation.weaknesses, coach_note: evaluation.coach_note })
        }
        return json({ passed: false, reason: evaluation.coach_note || '还需要再练练', score: evaluation.score, strengths: evaluation.strengths, weaknesses: evaluation.weaknesses, coach_note: evaluation.coach_note })
      }

      if (path === '/api/training/checkin-grid') {
        const { results } = await db.prepare('SELECT DISTINCT date FROM training_logs WHERE completed = 1 ORDER BY date').all()
        return json({ dates: results.map(r => r.date) })
      }

      if (path === '/api/training/daily-quote') {
        const td = today()
        const cached = await db.prepare('SELECT quote, source FROM daily_quotes WHERE date = ?').bind(td).first()
        if (cached) return json({ date: td, quote: cached.quote, source: cached.source, cached: true })
        let quote = null
        if (env.DEEPSEEK_API_KEY) {
          try {
            const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
              body: JSON.stringify({
                model: 'deepseek-chat', max_tokens: 200,
                messages: [{ role: 'system', content: '你是智者。给每天训练商业博弈能力的学员一句励志语录。要求：有深度不鸡汤、出自真实人物、不超过50字。用JSON回复：{"quote":"内容","source":"出处"}' }],
              }),
            })
            const data = await resp.json()
            const text = data.choices[0].message.content.trim()
            let js = text; if (text.startsWith('```')) js = text.split('\n').slice(1, -1).join('\n')
            quote = JSON.parse(js)
            await db.prepare('INSERT OR IGNORE INTO daily_quotes (date, quote, source) VALUES (?,?,?)').bind(td, quote.quote, quote.source).run()
          } catch {}
        }
        if (!quote) quote = { quote: '每天进步一点点，时间会给你答案。', source: '佚名' }
        return json({ date: td, quote: quote.quote, source: quote.source, cached: false })
      }

      if (path === '/api/training/roadmap') {
        const lessons = await db.prepare('SELECT module, lesson_index, title FROM lessons ORDER BY module, lesson_index').all()
        const logs = await db.prepare('SELECT DISTINCT module, lesson_index FROM training_logs WHERE completed = 1').all()
        const done = new Set(logs.results.map(r => `${r.module}|${r.lesson_index}`))
        const modules = []
        let currentModule = null
        for (const l of lessons.results) {
          if (l.module !== currentModule) { currentModule = l.module; modules.push({ module: l.module, lessons: [], completed: 0, total: 0 }) }
          const m = modules[modules.length - 1]
          if (done.has(`${l.module}|${l.lesson_index}`)) { m.completed++; m.lessons.push({ lesson_index: l.lesson_index, title: l.title, completed: true }) }
          else { m.lessons.push({ lesson_index: l.lesson_index, title: l.title, completed: false }) }
          m.total++
        }
        return json({ modules })
      }

      return json({ error: 'Not found' }, 404)
    } catch (e) {
      return json({ error: e.message }, 500)
    }
  },
}
