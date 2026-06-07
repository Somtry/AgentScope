"""
OpenAI SDK 包装 Demo
用法: 需要安装 openai 依赖: pip install agent-scope[openai]
    设置环境变量: export OPENAI_API_KEY=sk-xxx
    uv run python examples/demo_openai.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sdk"))

from agent_scope.openai_wrapper import TracedOpenAI as OpenAI


def main():
    client = OpenAI(base_url="http://localhost:8000")
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": "你好，介绍一下自己"}],
    )
    print(response.choices[0].message.content)
    client.complete_trace()
    print("\nTrace 已自动记录")


if __name__ == "__main__":
    main()
