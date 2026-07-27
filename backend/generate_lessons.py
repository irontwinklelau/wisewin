"""
课程内容生成器 — 使用 Claude API 批量生成训练课程
用法: python generate_lessons.py
"""
import json
import os
import sys
from openai import OpenAI

# DeepSeek API (OpenAI-compatible)
# 请在环境变量或 .env 文件中设置 DEEPSEEK_API_KEY
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-your-deepseek-key")
if not DEEPSEEK_API_KEY or DEEPSEEK_API_KEY.startswith("sk-your"):
    print("ERROR: 请设置环境变量 DEEPSEEK_API_KEY")
    sys.exit(1)
client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com/v1")

# ── 课程大纲 ──
COURSE_OUTLINE = [
    # 受害者叙事觉察 (Day 1 已在 seed.py 中手写)
    {
        "module": "不被PUA",
        "lesson_index": 2,
        "title": "识别你的受害者叙事模式",
        "description": "每个人都有自己的'触发词'——某些特定场景下，你会自动切换到受害者框架。今天的目标是找到你自己的触发模式。",
    },
    {
        "module": "不被PUA",
        "lesson_index": 3,
        "title": "叙事改写：职场场景实战",
        "description": "用你真实职场中的'翻车现场'来练习——把受害者叙事改写成策略选择者叙事。",
    },
    {
        "module": "不被PUA",
        "lesson_index": 4,
        "title": "叙事改写：人际与谈判场景",
        "description": "从职场扩展到更广的场景——薪资谈判、朋友借钱、家人期望。每个场景都可以换框架。",
    },
    {
        "module": "不被PUA",
        "lesson_index": 5,
        "title": "从'为什么是我'到'我选择什么'",
        "description": "受害者叙事的终极克星：在任何处境下，找出你仍然拥有的选择。哪怕只有一个。",
    },
    # 框架化表达
    {
        "module": "框架化表达",
        "lesson_index": 1,
        "title": "STAR法则的正确用法",
        "description": "STAR不是模板，是思维框架。今天学的是怎么用STAR把你的经验讲出逻辑链。",
    },
    {
        "module": "框架化表达",
        "lesson_index": 2,
        "title": "一句话能力标签",
        "description": "如果有人问你'你最擅长什么'，你能不能在30秒内说清楚？今天的目标是写出你的专属标签。",
    },
    {
        "module": "框架化表达",
        "lesson_index": 3,
        "title": "证据链一致性",
        "description": "你说的每句话，都经得起交叉验证吗？菲森面试官用三个不同角度问了同一件事，你给出的答案必须自洽。",
    },
]

SYSTEM_PROMPT = """你是「内功」产品的课程内容设计师。你的任务是生成结构化训练课程内容。

用户是一位有10年运营/增长经验的职场人，正在系统性地训练商业博弈能力。第一期训练聚焦"不被PUA"和"框架化表达"。

课程风格要求：
- 口吻是教练/导师，不是教科书。用"你"来直接对话。
- 案例要用用户的真实经历（菲森面试、飞之度工作、快金数据项目等），不要编造案例
- 每个概念都要落地到"你可以怎么做"，不要空谈理论
- 语言简洁有力，不要废话

输出格式：严格的JSON，按以下Schema：

{
  "one_liner": "本课核心观点的一句话总结",
  "concept": {
    "core": "核心概念讲解（2-3段）",
    "why_matters": "为什么这个能力重要"
  },
  "case": {
    "scenario": "场景描述",
    "analysis": "深度拆解",
    "key_takeaway": "你可以带走的一个具体动作"
  },
  "exercise": {
    "question": "今天的练习题目",
    "hint": "写不出来的话可以这样思考...",
    "placeholder": "文本输入的占位提示"
  },
  "next_preview": "明天训练主题的一句话预告"
}

重要：只输出JSON，不要有任何其他文字。"""


def generate_lesson(outline_item):
    """调用 DeepSeek API 生成一课内容"""
    user_prompt = f"""请为以下课程生成完整内容：

模块：{outline_item['module']}
第 {outline_item['lesson_index']} 课
标题：{outline_item['title']}
课程描述：{outline_item['description']}

用户背景：
- 10年运营/增长经验，经历过易加油、飞之度、快金数据、小蚁数字等公司
- 在菲森科技面试中暴露了"受害者叙事"模式：回答短任期问题时说"只能接受吧...并不是我主动要离开的"
- 核心痛点：面试/谈判时容易"降价求安全"，经验丰富但无法框架化表达

请只输出JSON，不要有其他文字。"""

    resp = client.chat.completions.create(
        model="deepseek-chat",
        max_tokens=4096,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )

    text = resp.choices[0].message.content.strip()
    # 去掉可能的 markdown 代码块标记
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("\n", 1)[0]

    return json.loads(text)


def main():
    print(f"Generating {len(COURSE_OUTLINE)} lessons...")

    from app.database import SessionLocal, Lesson

    db = SessionLocal()

    # 检查已存在的课程
    existing = db.query(Lesson).count()
    print(f"Existing lessons in DB: {existing}")

    for item in COURSE_OUTLINE:
        # 跳过已生成的
        exists = db.query(Lesson).filter(
            Lesson.module == item["module"],
            Lesson.lesson_index == item["lesson_index"],
        ).first()
        if exists:
            print(f"  [SKIP] {item['module']} Day {item['lesson_index']}: {item['title']} (already exists)")
            continue

        print(f"  [GEN] {item['module']} Day {item['lesson_index']}: {item['title']} ...")
        try:
            content = generate_lesson(item)
            lesson = Lesson(
                module=item["module"],
                lesson_index=item["lesson_index"],
                title=item["title"],
                content_json=content,
            )
            db.add(lesson)
            db.commit()
            print(f"         OK ({len(json.dumps(content))} chars)")
        except Exception as e:
            print(f"         FAIL: {e}")
            db.rollback()

    db.close()
    print("\nDone!")


if __name__ == "__main__":
    main()
