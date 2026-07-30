import { useState, useEffect } from 'react'
const API='https://neigong-api.iron-twinklelau.workers.dev/api'
const LV=['零','壹','贰','叁','肆']

function App(){
  const[v,sv]=useState('dash')
  const[u,su]=useState({level:0,streak_days:0,total_checkins:0,weapon_count:0})
  const[wp,sw]=useState([])
  const[l,sl]=useState(null)
  const[a,sa]=useState('')
  const[ld,sld]=useState(false)
  const[e,se]=useState(null)
  const[lt,slt]=useState(null)
  const[wv,swv]=useState(false)
  const[rv,srv]=useState(null)
  const[er,ser]=useState(null)
  const[swp,sswp]=useState(null)
  const[hy,shy]=useState([])
  const[hd,shd]=useState(null)
  const[gv,sgv]=useState(false)
  const[gd,sgd]=useState([])
  const[gq,sgq]=useState(null)
  const[rm,srm]=useState([])

  useEffect(()=>{fetch(`${API}/training/user`).then(r=>r.json()).then(d=>su(d)).catch(()=>{});fetch(`${API}/training/roadmap`).then(r=>r.json()).then(d=>srm(d.modules||[])).catch(()=>{})},[])
  const go=()=>{sv('dash');sl(null);sa('');se(null);swv(false);srv(null);ser(null);sswp(null);shd(null);fetch(`${API}/training/user`).then(r=>r.json()).then(d=>su(d)).catch(()=>{})}
  const start=async()=>{sld(true);se(null);try{const r=await fetch(`${API}/training/today`);const d=await r.json();if(d.status==='ok'){sl(d.lesson);su(d.user);sv('l1')}else se(d.message||'No content')}catch{se('网络连接失败')};sld(false)}
  const sub=async()=>{if(!a.trim())return;sld(true);try{const r=await fetch(`${API}/training/submit`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lesson_id:l.id,answer:a})});const d=await r.json();if(d.status==='ok'){su(p=>({...p,streak_days:d.streak_days,total_checkins:d.total_checkins,weapon_count:d.weapon_count}));srv(d.review||null);sv('ok')}else if(d.status==='already_checked_in')se('今天已经打卡过了')}catch{se('提交失败')};sld(false)}
  const chkLv=async()=>{try{const r=await fetch(`${API}/training/level-up-status`);const d=await r.json();if(d.can_test)slt(d)}catch{}}
  const lw=async()=>{try{const r=await fetch(`${API}/training/weapons`);const d=await r.json();sw(d.weapons||[]);swv(true)}catch{swv(true)}}
  const lh=async()=>{try{const r=await fetch(`${API}/training/history`);const d=await r.json();shy(d.logs||[]);sv('hy')}catch{se('加载失败')}}
  const openGrid=async()=>{try{const[r1,r2]=await Promise.all([fetch(`${API}/training/checkin-grid`),fetch(`${API}/training/daily-quote`)]);sgd((await r1.json()).dates||[]);sgq(await r2.json());sgv(true)}catch{}}
  const goGrid=()=>{sgd([]);sgq(null);sgv(false)}
  const lc=async(id)=>{sld(true);shd(null);sv('hd');try{const r=await fetch(`${API}/training/history/compare`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({log_id:id})});const d=await r.json();shd(d)}catch{se('分析失败')};sld(false)}
  const doLt=async()=>{if(a.length<10){se('写得太少了');return};sld(true);try{const r=await fetch(`${API}/training/level-up-test`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answer:a})});const d=await r.json();if(d.passed){su(p=>({...p,level:d.new_level}));ser(d);sv('lup');slt(null)}else{ser(d);se(null)}}catch{se('提交失败')};sld(false)}
  useEffect(()=>{chkLv()},[u.total_checkins])

  return(<>
    {v==='dash'&&<Dash u={u} err={e} ld={ld} os={start} lt={lt} olt={()=>sv('lt')} ow={lw} oh={lh} og={openGrid} rm={rm}/>}
    {gv&&<Grid gd={gd} gq={gq} oc={goGrid}/>}
    {wv&&!swp&&<Wpns wp={wp} oh={go} os={sswp}/>}
    {wv&&swp&&<Wpd w={swp} ob={()=>sswp(null)} oh={go}/>}
    {v==='hy'&&<Hy lg={hy} os={lc} oh={go}/>}
    {v==='hd'&&<Hd d={hd} ld={ld} ob={()=>{shd(null);sv('hy')}} oh={go}/>}
    {v==='lt'&&lt&&<Lt t={lt} a={a} sa={sa} err={e} er={er} os={doLt} oh={go}/>}
    {v==='lup'&&<Lu u={u} er={er} oh={go}/>}
    {v==='l1'&&l&&<L1 l={l} on={()=>sv('l2')} oh={go}/>}
    {v==='l2'&&l&&<L2 l={l} on={()=>sv('l3')} oh={go}/>}
    {v==='l3'&&l&&<L3 l={l} a={a} sa={sa} os={sub} oh={go}/>}
    {v==='ok'&&<Ok u={u} l={l} lt={lt} rv={rv} oh={go} olt={()=>sv('lt')}/>}
  </>)
}

function Dash({u,err,ld,os,lt,olt,ow,oh,og,rm}){
  return <div className="animate-fade-in" style={co}>
    <div style={tb}><span style={s20}>内功</span><span style={s13}>{new Date().toLocaleDateString('zh-CN',{weekday:'long',month:'long',day:'numeric'})}</span></div>
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:40,padding:'48px 0 32px'}}>
      <div style={{position:'relative',width:140,height:140,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'2px solid var(--accent)',opacity:.5}}/>
        <div style={{position:'absolute',inset:8,borderRadius:'50%',border:'1px dashed var(--accent)',opacity:.35}}/>
        <span style={{fontFamily:'var(--font-serif)',fontSize:40,fontWeight:700,lineHeight:1}}>{LV[u.level]}</span>
        <span style={s13}>LV · {u.level}</span>
      </div>
      <div style={{display:'flex',gap:48}}>
        <div style={{textAlign:'center'}}><div style={s32}>{u.streak_days}</div><div style={s13}>连续打卡</div></div>
        <div style={{width:1,background:'var(--border-light)'}}/>
        <div onClick={ow} style={{textAlign:'center',cursor:'pointer'}}><div style={s32}>{u.weapon_count}</div><div style={s13}>武器库 →</div></div>
      </div>
      {err&&<div style={eb}>{err}</div>}
      {lt?<button onClick={olt} style={b1}>升段测验<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      :<button onClick={os} disabled={ld} style={{...b1,opacity:ld?.7:1}}>{ld?'加载中...':'今日训练'}<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
    </div>
    <Div t="训练路线图"/>
    <div onClick={oh} style={mi}>
      <span style={{fontSize:18}}>📋</span>
      <div><div style={{fontSize:15,fontWeight:500}}>训练记录</div><div style={{fontSize:13,color:'var(--text-tertiary)'}}>回顾答题与差距分析</div></div>
      <span style={{marginLeft:'auto',color:'var(--text-tertiary)'}}>→</span>
    </div>
    <div onClick={og} style={mi}>
      <span style={{fontSize:18}}>📅</span>
      <div><div style={{fontSize:15,fontWeight:500}}>打卡日历</div><div style={{fontSize:13,color:'var(--text-tertiary)'}}>查看打卡记录与每日一语</div></div>
      <span style={{marginLeft:'auto',color:'var(--text-tertiary)'}}>→</span>
    </div>
    {rm.length>0?rm.map(m=><div key={m.module}>
      <div style={{fontSize:13,color:'var(--text-tertiary)',fontWeight:600,marginBottom:8,marginTop:12}}>{m.module} · {m.completed}/{m.total}</div>
      {m.lessons.map((l,i)=><Rm key={i} t={l.title} a={l.completed}/>)}
    </div>):<><Rm t="不被PUA · 受害者叙事觉察" a/><Rm t="不被PUA · 框架化表达"/><Rm t="不被PUA · 自我估值校准"/></>}
  </div>
}

// Weapons
function Wpns({wp,oh,os}){
  const bm={};wp.forEach(w=>{if(!bm[w.module])bm[w.module]=[];bm[w.module].push(w)})
  return <div className="animate-fade-in" style={co}><Top oh={oh} sub={'武器库 · '+wp.length+' 件'}/><div style={s26}>知识武器库</div>
    {wp.length===0&&<Card><p style={{textAlign:'center',color:'var(--text-tertiary)'}}>完成第一次训练来获得你的第一件武器。</p></Card>}
    {Object.entries(bm).map(([m,items])=><div key={m} style={{display:'flex',flexDirection:'column',gap:12}}><div style={{fontSize:13,color:'var(--text-tertiary)',fontWeight:600}}>{m}</div>
      {items.map(w=><div key={w.id} onClick={()=>os(w)} style={{...mi,cursor:'pointer'}}><span style={{fontSize:24}}>🗡️</span><div><div style={{fontSize:15,fontWeight:600}}>{w.name}</div>{w.definition&&<div style={{fontSize:14,color:'var(--text-secondary)',marginTop:4}}>{w.definition}</div>}<div style={{fontSize:12,color:'var(--text-tertiary)',marginTop:4}}>点击回顾 →</div></div></div>)}
    </div>)}
    <button onClick={oh} style={bG}>← 回到首页</button></div>
}

function Wpd({w,ob,oh}){
  return <div className="animate-fade-in" style={co}><Top oh={oh} sub="武器详情"/>
    <div style={{textAlign:'center',padding:'32px 0 20px'}}><span style={{fontSize:48}}>🗡️</span></div>
    <div style={{fontFamily:'var(--font-serif)',fontSize:24,fontWeight:700,textAlign:'center'}}>{w.name}</div>
    {w.definition&&<Card><p>{w.definition}</p></Card>}
    <Card title="所属模块"><p>{w.module}</p></Card>
    {w.acquired_at&&<Card title="获得时间"><p>{new Date(w.acquired_at).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}</p></Card>}
    <div style={{display:'flex',gap:12,justifyContent:'center'}}><button onClick={ob} style={bG}>← 返回武器库</button><button onClick={oh} style={bG}>← 回到首页</button></div></div>
}

// History
function Hy({lg,os,oh}){
  return <div className="animate-fade-in" style={co}><Top oh={oh} sub={`训练记录 · ${lg.length} 次`}/><div style={s26}>训练记录</div>
    {lg.length===0&&<Card><p style={{textAlign:'center',color:'var(--text-tertiary)'}}>还没有训练记录。</p></Card>}
    {lg.map((x,i)=><div key={i} onClick={()=>os(x.id)} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'20px 24px',cursor:'pointer',display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><span style={{fontSize:14,fontWeight:600,flex:1}}>{x.module}{x.lesson_title?' · '+x.lesson_title:''}</span><span style={{fontSize:12,color:'var(--text-tertiary)',flexShrink:0,marginLeft:12}}>{x.date}</span></div>
      {x.exercise_answer&&<div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,wordBreak:'break-all'}}>{x.exercise_answer.length>80?x.exercise_answer.slice(0,80)+'...':x.exercise_answer}</div>}
      <div style={{fontSize:12,color:'var(--accent)',marginTop:4}}>查看评分与差距分析 →</div>
    </div>)}
    <button onClick={oh} style={bG}>← 回到首页</button></div>
}

function Hd({d,ld,ob,oh}){
  if(ld||!d)return<div className="animate-fade-in" style={co}><Top oh={oh} sub="加载中..."/><div style={{textAlign:'center',padding:40}}>{ld?'AI 分析中，约需 5-10 秒...':'加载中...'}</div></div>
  const an=d.analysis
  return <div className="animate-fade-in" style={co}>
    <Top oh={oh} sub={`训练回顾 · ${d.log.date}`}/>
    <div style={{fontFamily:'var(--font-serif)',fontSize:22,fontWeight:700}}>{d.log.lesson_title||d.log.module||'训练记录'}</div>
    <Card title="📝 题目"><p>{d.log.question||'（原题目未保存）'}</p></Card>
    <Card title="✏️ 你的回答"><p style={{whiteSpace:'pre-wrap'}}>{d.log.answer||'(空)'}</p></Card>
    {an&&<>
      {an.total_score?<div style={{background:'var(--surface)',border:'2px solid var(--accent)',borderRadius:10,padding:'28px 32px',display:'flex',flexDirection:'column',gap:20}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{width:80,height:80,borderRadius:'50%',background:`conic-gradient(var(--accent) ${an.total_score}%, var(--border-light) 0)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <span style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:700}}>{an.total_score}</span>
          </div>
          <div><div style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:700}}>综合得分</div><div style={{fontSize:13,color:'var(--text-tertiary)'}}>满分 100 · 四维度各 25 分</div></div>
        </div>
        {an.scoring&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
          {Object.entries(an.scoring).map(([k,v])=>{
            const lb={framework:{n:'框架运用',i:'🏗️'},awareness:{n:'自我觉察',i:'🪞'},evidence:{n:'具体证据',i:'📊'},narrative:{n:'叙事升级',i:'📈'}}
            const l=lb[k]||{n:k,i:'📌'};const pct=(v.score/v.max)*100
            const cl=pct>=80?'var(--success)':pct>=60?'var(--accent)':pct>=40?'var(--warn)':'#C47A3A'
            return <div key={k}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><span style={{fontSize:14}}>{l.i} {l.n}</span><span style={{fontSize:14,fontWeight:600,color:cl}}>{v.score}/{v.max}</span></div>
            <div style={{height:6,background:'var(--border-light)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:cl,borderRadius:3}}/></div>
            <div style={{fontSize:12,color:'var(--text-tertiary)',marginTop:2}}>{v.comment}</div></div>
          })}
        </div>}
      </div>:null}
      {an.core_gap&&<div style={{background:'var(--accent-soft)',border:'2px solid var(--accent)',borderRadius:10,padding:'24px 28px',display:'flex',flexDirection:'column',gap:16}}>
        <div style={{fontFamily:'var(--font-serif)',fontSize:18,fontWeight:700}}>🧠 差距分析</div>
        <div><div style={{fontSize:11,color:'var(--warn)',fontWeight:600,marginBottom:4}}>本质差距</div><div style={{fontSize:15,fontWeight:600,lineHeight:1.6}}>{an.core_gap}</div></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{background:'#FFF4ED',borderRadius:8,padding:16}}><div style={{fontSize:11,color:'#C47A3A',fontWeight:600,marginBottom:6}}>你的思维模式</div><div style={{fontSize:14,lineHeight:1.6,color:'#8B5A3A'}}>{an.their_approach}</div></div>
          <div style={{background:'#EDF7F0',borderRadius:8,padding:16}}><div style={{fontSize:11,color:'var(--success)',fontWeight:600,marginBottom:6}}>更好的思维模式</div><div style={{fontSize:14,lineHeight:1.6,color:'#3A6B4A'}}>{an.better_approach}</div></div>
        </div>
        {an.example&&<Card title="💡 高阶回答示例"><p style={{fontStyle:'italic'}}>{an.example}</p></Card>}
        {an.action_items&&<Card title="📋 下次注意"><ul style={{paddingLeft:20,display:'flex',flexDirection:'column',gap:8}}>{an.action_items.map((x,i)=><li key={i} style={{fontSize:14,lineHeight:1.6}}>{x}</li>)}</ul></Card>}
      </div>}
    </>}
    {!an&&<Card><p style={{textAlign:'center',color:'var(--text-tertiary)'}}>暂无分析数据。完成训练后会自动生成。</p></Card>}
    <div style={{display:'flex',gap:12,justifyContent:'center'}}><button onClick={ob} style={bG}>← 返回记录列表</button><button onClick={oh} style={bG}>← 回到首页</button></div></div>
}

// Lessons
function L1({l,on,oh}){const c=l.content;return<div className="animate-fade-in" style={co}><Top oh={oh} sub={l.module+' · Day '+l.lesson_index}/><Pb s={1}t={4}/><div style={s26}>{l.title}</div><div style={{fontSize:15,color:'var(--text-secondary)'}}>{c.one_liner}</div>
    <Card title="核心概念"><p><strong>受害者叙事</strong>：{c.concept.victim}</p><p style={{marginTop:12}}><strong>策略选择者叙事</strong>：{c.concept.strategist}</p><p style={{marginTop:16,fontSize:14,color:'var(--text-tertiary)'}}>{c.concept.key_insight}</p></Card>
    <Cal l={'真实案例 · '+c.case.source} q={'"'+c.case.question+'"'} s={'—— '+c.case.interviewer}/>
    <div style={{fontSize:15,lineHeight:1.8,color:'var(--text-secondary)'}}>当时你的回答：<br/><span style={{color:'var(--text)',fontWeight:500}}>"{c.case.your_answer}"</span><br/><br/>这是一个典型的<strong>受害者叙事</strong>。</div>
    <div style={{alignSelf:'flex-end'}}><Btn on={on}>继续 · 拆解案例</Btn></div></div>}
function L2({l,on,oh}){const c=l.content;return<div className="animate-fade-in" style={co}><Top oh={oh} sub={l.module+' · Day '+l.lesson_index}/><Pb s={2}t={4}/><div style={s26}>逐句拆解</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}><Cb l="面试官听到的" tone="bad">{c.case.what_he_heard.map((x,i)=><p key={i} style={{marginBottom:8}}>{x}</p>)}</Cb><Cb l="面试官想听到的" tone="good">{c.case.what_he_wanted.map((x,i)=><p key={i} style={{marginBottom:8}}>{x}</p>)}</Cb></div>
    <Card title="💡 关键洞察">{c.case.deep_insight.split('\n\n').map((p,i)=><p key={i} style={{marginBottom:i?0:12}}>{p}</p>)}</Card>
    <div style={{alignSelf:'flex-end'}}><Btn on={on}>继续 · 开始练习</Btn></div></div>}
function L3({l,a,sa,os,oh}){const c=l.content;return<div className="animate-fade-in" style={co}><Top oh={oh} sub={l.module+' · Day '+l.lesson_index}/><Pb s={3}t={4}/>
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'24px 28px'}}><div style={{fontSize:11,color:'var(--text-tertiary)',marginBottom:8}}>今日练习</div><div style={{fontFamily:'var(--font-serif)',fontSize:20,lineHeight:1.6,fontWeight:600}}>{c.exercise.question}</div></div>
    <div style={{position:'relative'}}><textarea value={a} onChange={e=>sa(e.target.value)} placeholder={c.exercise.placeholder} style={ta}/><span style={{position:'absolute',bottom:12,right:16,fontSize:12,color:'var(--text-tertiary)'}}>{a.length} 字</span></div>
    <div style={{alignSelf:'flex-end'}}><Btn on={os} d={!a.trim()}>提交 · 完成打卡</Btn></div></div>}

function Ok({u,l,lt,rv,oh,olt}){
  return <div className="animate-fade-in" style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'64px 0 48px',gap:32}}>
    <div className="animate-badge-in" style={{width:100,height:100,borderRadius:'50%',background:'linear-gradient(135deg, var(--accent), #E0A060)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'#FFF',fontSize:40}}>✓</span></div>
    <div style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:700}}>训练完成</div>
    <div style={{fontSize:15,color:'var(--text-secondary)',textAlign:'center',lineHeight:1.8}}>连续打卡 <strong>{u.streak_days}</strong> 天<br/>武器库 +1（共 {u.weapon_count} 件）</div>
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 20px',borderRadius:24,background:'var(--accent-soft)',fontSize:14}}><span>🗡️</span><span>{l.module} · {l.title} 已加入武器库</span></div>
    {rv&&<div style={{width:'100%',background:'var(--surface)',border:'1px solid var(--accent)',borderRadius:10,padding:'20px 24px',textAlign:'left'}}><div style={{fontSize:11,color:'var(--accent)',marginBottom:8,fontWeight:600}}>🧠 教练点评</div><div style={{fontSize:14,lineHeight:1.8,color:'var(--text-secondary)'}}>{rv}</div></div>}
    {lt&&<button onClick={olt} style={b1}>参加升段测验 → LV.{u.level+1}</button>}
    <button onClick={oh} style={bG}>回到首页</button></div>
}

function Lt({t,a,sa,err,er,os,oh}){
  return <div className="animate-fade-in" style={co}><Top oh={oh} sub={'LV.'+t.current_level+' → LV.'+t.next_level}/><div style={s26}>升段测验</div>
    <div style={{background:'var(--accent-soft)',border:'1px solid var(--accent)',borderRadius:10,padding:'24px 28px'}}><div style={{fontFamily:'var(--font-serif)',fontSize:18,lineHeight:1.7}}>{t.test.question}</div></div>
    <textarea value={a} onChange={e=>sa(e.target.value)} placeholder="写下你的回答..." style={{...ta,minHeight:150}}/>
    {err&&<div style={eb}>{err}</div>}
    {er&&!er.passed&&<div style={{width:'100%',background:'var(--surface)',border:'1px solid var(--warn)',borderRadius:10,padding:'20px 24px',display:'flex',flexDirection:'column',gap:12}}>
      <div style={{fontSize:11,color:'var(--warn)',fontWeight:600}}>📝 批改结果 · 未通过（{er.score}/10）</div>
      {er.strengths&&<div style={{fontSize:14,color:'var(--success)'}}>✅ {er.strengths}</div>}
      {er.weaknesses&&<div style={{fontSize:14,color:'var(--warn)'}}>⚠️ {er.weaknesses}</div>}
      {er.coach_note&&<div style={{fontSize:14,color:'var(--text-secondary)',fontStyle:'italic',borderTop:'1px solid var(--border-light)',paddingTop:12}}>{er.coach_note}</div>}
      <div style={{fontSize:14,color:'var(--text-secondary)'}}>修改后重新提交。</div>
    </div>}
    <div style={{alignSelf:'flex-end'}}><Btn on={os}>提交答案 · 升段</Btn></div></div>
}

function Lu({u,er,oh}){
  return <div className="animate-fade-in" style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'64px 0 48px',gap:32}}>
    <div className="animate-badge-in" style={{width:120,height:120,borderRadius:'50%',background:'linear-gradient(135deg, var(--accent), #F0C060)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:'var(--font-serif)',fontSize:40,fontWeight:700,color:'#FFF'}}>{LV[u.level]}</div></div>
    <div style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:700}}>升段成功！</div>
    {er&&<div style={{fontSize:15,color:'var(--text-secondary)',textAlign:'center'}}>评分：<strong>{er.score}/10</strong></div>}
    <div style={{fontSize:15,color:'var(--text-secondary)',textAlign:'center'}}>你已升至 <strong style={{color:'var(--accent)'}}>LV.{u.level}</strong></div>
    {er&&er.coach_note&&<div style={{width:'100%',background:'var(--surface)',border:'1px solid var(--accent)',borderRadius:10,padding:'20px 24px',fontSize:14,lineHeight:1.8,color:'var(--text-secondary)',fontStyle:'italic'}}>{er.coach_note}</div>}
    <button onClick={oh} style={bG}>回到首页</button></div>
}

// ── Grid Modal ──
function Grid({gd,gq,oc}){
  const weeks=[]
  const end=new Date();const start=new Date(end);start.setDate(start.getDate()-83)
  const ds=new Set(gd)
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const w=Math.floor((d-start)/(86400000*7))
    if(!weeks[w])weeks[w]=[]
    weeks[w].push(d.toISOString().slice(0,10))
  }
  const days=['','一','','三','','五','']
  return <div onClick={oc} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:16,padding:'32px 28px 24px',maxWidth:420,width:'100%',maxHeight:'90vh',overflow:'auto',display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:700}}>打卡日历</div>
        <span onClick={oc} style={{fontSize:24,cursor:'pointer',color:'var(--text-tertiary)',lineHeight:1}}>×</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
        <div style={{display:'flex',gap:3,marginBottom:4}}>{days.map((d,i)=><div key={i} style={{width:26,fontSize:10,color:'var(--text-tertiary)',textAlign:'center'}}>{d}</div>)}</div>
        {weeks.map((w,wi)=><div key={wi} style={{display:'flex',gap:3}}>
          {w.map((date,di)=>{
            const checked=ds.has(date)
            const today=date===new Date().toISOString().slice(0,10)
            return <div key={di} title={date} style={{width:26,height:26,borderRadius:4,background:checked?today?'var(--accent)':'var(--success)':'var(--border-light)',opacity:checked?1:.5,transition:'all .2s'}}/>
          })}
        </div>)}
      </div>
      <div style={{display:'flex',gap:12,alignItems:'center',fontSize:12,color:'var(--text-tertiary)'}}>
        <span style={{width:10,height:10,borderRadius:2,background:'var(--success)',display:'inline-block'}}/>已打卡
        <span style={{width:10,height:10,borderRadius:2,background:'var(--accent)',display:'inline-block'}}/>今天
        <span style={{width:10,height:10,borderRadius:2,background:'var(--border-light)',display:'inline-block'}}/>未打卡
      </div>
      {gq&&<div style={{background:'var(--accent-soft)',borderRadius:10,padding:'20px 24px',display:'flex',flexDirection:'column',gap:8}}>
        <div style={{fontSize:11,color:'var(--accent)',fontWeight:600}}>💬 每日一语</div>
        <div style={{fontFamily:'var(--font-serif)',fontSize:16,lineHeight:1.7,fontStyle:'italic'}}>"{gq.quote}"</div>
        <div style={{fontSize:12,color:'var(--text-tertiary)',textAlign:'right'}}>—— {gq.source}</div>
      </div>}
      <div style={{textAlign:'center'}}><button onClick={oc} style={bG}>关闭</button></div>
    </div></div>
}

// Shared
const co={display:'flex',flexDirection:'column',gap:28}
const s13={fontSize:13,color:'var(--text-tertiary)'}
const s20={fontFamily:'var(--font-serif)',fontSize:20,fontWeight:700}
const s26={fontFamily:'var(--font-serif)',fontSize:26,fontWeight:700}
const s32={fontSize:32,fontWeight:600,letterSpacing:'-0.02em'}
const tb={display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:16,borderBottom:'1px solid var(--border-light)'}
const eb={padding:'8px 16px',borderRadius:8,background:'var(--accent-soft)',color:'var(--warn)',fontSize:14}
const ta={width:'100%',minHeight:180,padding:'20px 24px',border:'1px solid var(--border)',borderRadius:10,fontFamily:'var(--font-sans)',fontSize:15,lineHeight:1.8,color:'var(--text)',background:'var(--surface)',resize:'vertical',outline:'none'}
const b1={display:'inline-flex',alignItems:'center',gap:10,padding:'16px 40px',background:'var(--accent)',color:'#FFF',border:'none',borderRadius:10,fontSize:16,fontWeight:500,cursor:'pointer'}
const bG={display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',background:'transparent',color:'var(--text-secondary)',border:'1px solid var(--border)',borderRadius:6,fontSize:14,cursor:'pointer',alignSelf:'center'}
const mi={background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'16px 24px',display:'flex',alignItems:'center',gap:12,transition:'all .2s'}

function Top({oh,sub}){return<div style={tb}><span onClick={oh} style={{...s20,cursor:'pointer'}}>← 内功</span><span style={s13}>{sub}</span></div>}
function Pb({s,t}){return<div style={{display:'flex',alignItems:'center',gap:10}}><div style={{flex:1,height:3,background:'var(--border-light)',borderRadius:2}}><div style={{height:'100%',width:`${(s/t)*100}%`,background:'var(--accent)',borderRadius:2}}/></div><span style={{fontSize:12,color:'var(--text-tertiary)'}}>{s}/{t}</span></div>}
function Card({title,children}){return<div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'28px 32px'}}>{title&&<div style={{fontSize:15,fontWeight:600,marginBottom:12}}>{title}</div>}<div style={{fontSize:15,color:'var(--text-secondary)',lineHeight:1.8}}>{children}</div></div>}
function Cal({l,q,s}){return<div style={{borderLeft:'3px solid var(--accent)',padding:'16px 20px',background:'var(--accent-soft)',borderRadius:'0 6px 6px 0'}}><div style={{fontSize:11,color:'var(--accent)',marginBottom:6,fontWeight:600}}>{l}</div><div style={{fontFamily:'var(--font-serif)',fontSize:17,lineHeight:1.7}}>{q}</div>{s&&<div style={{fontSize:12,color:'var(--text-tertiary)',marginTop:8}}>{s}</div>}</div>}
function Cb({l,tone,children}){const c=tone==='bad'?'#C4A08A':'var(--success)';return<div style={{border:'1px solid var(--border)',borderLeft:`3px solid ${c}`,borderRadius:10,padding:'20px 24px'}}><div style={{fontSize:11,fontWeight:600,marginBottom:12,color:c}}>{l}</div><div style={{fontSize:15,lineHeight:1.8}}>{children}</div></div>}
function Div({t}){return<div style={{display:'flex',alignItems:'center',gap:12,color:'var(--text-tertiary)',fontSize:13}}><span style={{flex:1,height:1,background:'var(--border-light)'}}/>{t}<span style={{flex:1,height:1,background:'var(--border-light)'}}/></div>}
function Rm({t,a}){return<div style={{...mi,opacity:a?1:.6}}><div style={{width:8,height:8,borderRadius:'50%',background:a?'var(--success)':'var(--border)'}}/><div><div style={{fontSize:15,fontWeight:500}}>{t}</div>{a&&<div style={{fontSize:12,color:'var(--success)'}}>✓ 已完成</div>}</div></div>}
function Btn({on,d,children}){return<button onClick={on} disabled={d} style={{display:'inline-flex',alignItems:'center',gap:10,padding:'12px 24px',background:'var(--accent)',color:'#FFF',border:'none',borderRadius:10,fontSize:14,fontWeight:500,cursor:d?'default':'pointer',opacity:d?.5:1}}>{children}<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}

export default App
