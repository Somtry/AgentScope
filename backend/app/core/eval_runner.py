import re
import json
import httpx


async def call_agent(endpoint: str, input_text: str) -> str:
    """调用 agent endpoint 获取输出"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(endpoint, json={"input": input_text})
        resp.raise_for_status()
        return resp.json().get("output", "")


def score_exact_match(output: str, expected: str) -> float:
    """完全匹配评分"""
    return 1.0 if output.strip() == expected.strip() else 0.0


def score_contains(output: str, keywords: list[str]) -> float:
    """包含关键词评分"""
    if not keywords:
        return 1.0
    matched = sum(1 for kw in keywords if kw in output)
    return matched / len(keywords)


def score_regex(output: str, pattern: str) -> float:
    """正则匹配评分"""
    return 1.0 if re.search(pattern, output) else 0.0


def evaluate_case(output: str, expected: str | None, rules: list[dict]) -> tuple[float, list[dict]]:
    """对单条用例评分，返回 (总分, 详细结果)"""
    if not rules:
        return 0.0, []

    total_weight = sum(r.get("weight", 1.0) for r in rules)
    weighted_score = 0.0
    details = []

    for rule in rules:
        rule_type = rule["type"]
        weight = rule.get("weight", 1.0)
        config = rule.get("config", {})

        if rule_type == "exact_match":
            score = score_exact_match(output, expected or "")
        elif rule_type == "contains":
            score = score_contains(output, config.get("keywords", []))
        elif rule_type == "regex":
            score = score_regex(output, config.get("pattern", ""))
        else:
            score = 0.0

        weighted_score += score * weight
        details.append({"type": rule_type, "score": score, "weight": weight})

    final_score = weighted_score / total_weight if total_weight > 0 else 0.0
    return final_score, details


def compute_dimensions(results: list[dict]) -> dict:
    """根据评测结果计算能力维度分数"""
    if not results:
        return {"accuracy": 0, "relevance": 0, "efficiency": 0, "safety": 0}

    avg_score = sum(r["score"] for r in results) / len(results)
    return {
        "accuracy": round(avg_score, 3),
        "relevance": round(avg_score, 3),
        "efficiency": round(avg_score, 3),
        "safety": 1.0,
    }
