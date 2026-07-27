"""
种子数据 — 第一课：受害者叙事觉察
运行一次即可：python seed.py
"""
import json
import os
import sys

# 确保 data 目录存在
os.makedirs("data", exist_ok=True)

from app.database import engine, Base, SessionLocal, Lesson

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# 清空旧数据
db.query(Lesson).delete()
db.commit()

# ── 第一课：受害者叙事觉察 ──
lesson_1 = Lesson(
    module="不被PUA",
    lesson_index=1,
    title="受害者叙事 vs 策略选择者叙事",
    content_json={
        "one_liner": "同样一件事，用不同的框架讲述，结果完全不同",
        "concept": {
            "victim": "受害者叙事：事情发生在我身上，我是被动的、无奈的。讲出来的故事里，你是'被命运安排的人'。",
            "strategist": "策略选择者叙事：我在每个节点做了当时我能做的最优选择。即使结果不完美，选择权始终在我手里。",
            "key_insight": "两者讲的是完全同一段经历——区别只在于你怎么组织这些事实。"
        },
        "case": {
            "source": "菲森科技面试 · 2026年7月",
            "question": "你的整个履历当中普遍工作时长很短，你对这个事情怎么评价？",
            "interviewer": "藤真（菲森科技COO）",
            "your_answer": "只能说接受吧…并不是我主动要去选择离开的…",
            "what_he_heard": [
                "'只能接受' → 这个人觉得自己是受害者",
                "'并不是我主动要离开的' → 他没有职业选择的标准",
                "沉默 → 他没有反思过这个问题"
            ],
            "what_he_wanted": [
                "'每段经历都是我的主动选择' → 我是一个有标准的人",
                "'我来菲森也是基于同样的选择逻辑' → 这次选择是深思熟虑的",
                "具体的归因 → 我在持续成长"
            ],
            "deep_insight": "藤真问这个问题的真实目的不是让你解释'为什么短'——他是在测试你如何看待自己的过去。\n\n你用的是受害者框架（'只能接受'），他读到的是：这个人遇到挫折不会复盘、不会迭代选择标准、未来遇到问题还会是同样的反应。\n\n如果你用的是策略选择者框架，同样这些经历可以讲成：你在不同阶段有意识地在补不同的能力短板——易加油补B端运营、飞之度补供应链策略、快金数据补数据驱动增长。"
        },
        "exercise": {
            "question": "用「策略选择者」视角，重新描述你的短任期经历。",
            "hint": "不用回避事实。同样的经历，换一个框架来组织。想想你在每个节点主动选择了什么、学到了什么、这个选择如何导向下一段经历。",
            "placeholder": "我的第一份工作在易加油，当时我选择加入的原因是____，在那里我学会了____。当我意识到____之后，我主动选择离开，因为我想补____的能力…"
        },
        "next_preview": "锚定效应与自我压价"
    }
)
db.add(lesson_1)

db.commit()
db.close()

print("[OK] 种子数据已写入: data/neigong.db")
print("     第一课: 不被PUA / 受害者叙事 vs 策略选择者叙事")
