import os
import re
import time
from collections import deque
from datetime import datetime

import ollama

MODEL_NAME = os.getenv("OLLAMA_MODEL", "phi3.5:latest")

llm_stats = {
    "total_calls": 0,
    "successful_calls": 0,
    "failed_calls": 0,
    "avg_latency_ms": 0.0,
    "last_call_at": None,
    "model_name": MODEL_NAME,
    "status": "offline",
}

_llm_latency_samples = deque(maxlen=10)
_llm_recent_results = deque(maxlen=3)

TEMPLATES = {
    "cpu_spike":             lambda a: f"{a['pod']} is experiencing high CPU ({a.get('cpu_percent', '?')}%). Likely caused by a sudden request spike or compute-intensive task — consider scaling replicas.",
    "memory_leak":           lambda a: f"Memory leak detected on {a['pod']} growing at {a.get('growth_rate', '?')}%/min. Recommend pod restart and code review of memory allocation.",
    "high_memory":           lambda a: f"{a['pod']} is consuming {a.get('memory_percent', '?')}% memory. Monitor for leak pattern; consider increasing memory limits.",
    "network_spike_inbound": lambda a: f"Unusual inbound traffic spike on {a['pod']} ({a.get('multiplier', '?')}x baseline). Verify request sources and check for DDoS or load generator activity.",
    "network_spike_outbound":lambda a: f"{a['pod']} sending {a.get('multiplier', '?')}x normal outbound traffic. Check for data export tasks or misconfigured retry loops.",
    "dependency_failure":    lambda a: f"{a['pod']} experiencing strain due to upstream instability in {a.get('source', 'a dependency')}. Prioritize recovery of {a.get('source', 'dependency')} to restore normal operation.",
}

class InsightGenerator:
    def __init__(self, model_name=MODEL_NAME):
        self.model = model_name

    def _record_llm_call(self, success: bool, latency_ms: float) -> None:
        llm_stats["total_calls"] += 1
        if success:
            llm_stats["successful_calls"] += 1
        else:
            llm_stats["failed_calls"] += 1

        _llm_latency_samples.append(latency_ms)
        llm_stats["avg_latency_ms"] = round(sum(_llm_latency_samples) / len(_llm_latency_samples), 2)
        llm_stats["last_call_at"] = datetime.utcnow().isoformat()
        _llm_recent_results.append(success)

        if len(_llm_recent_results) == 3 and not any(_llm_recent_results):
            llm_stats["status"] = "offline"
        elif success:
            llm_stats["status"] = "degraded" if llm_stats["avg_latency_ms"] > 3000 else "online"
        else:
            llm_stats["status"] = "degraded"

    def _chat(self, prompt: str):
        start = time.time()
        success = False
        try:
            response = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            success = True
            return response
        except Exception as e:
            print(f"[LLM] Fallback used: {e}")
            return None
        finally:
            self._record_llm_call(success, (time.time() - start) * 1000)

    def generate_insight(self, prompt: str) -> str:
        resp = self._chat(prompt)
        if resp:
            text = resp["message"]["content"].strip()
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
            if not sentences:
                return text
            return " ".join(sentences[:2]).strip()
        return "LLM unavailable. Review the related metrics and logs for more detail."

    def generate_bullets(self, prompt: str, fallback_bullets: list[str]) -> list[str]:
        resp = self._chat(prompt)
        if resp:
            text = resp["message"]["content"].strip()
            bullets = []
            for line in text.splitlines():
                cleaned = line.strip().lstrip("-*•").strip()
                if cleaned:
                    bullets.append(cleaned)

            if not bullets:
                bullets = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]

            return bullets[:3] if bullets else fallback_bullets
        return fallback_bullets

    async def generate(self, anomaly: dict, metrics: dict) -> str:
        pod     = anomaly.get("pod", "unknown")
        pod_m   = metrics.get(pod, {})
        prompt  = (
            f"You are a Kubernetes SRE. Analyze this anomaly and give a 1-2 sentence operational insight.\n\n"
            f"Anomaly: {anomaly}\n"
            f"Pod metrics: CPU={pod_m.get('cpu_percent','?')}%, "
            f"Memory={pod_m.get('memory_percent','?')}%, "
            f"Restarts={pod_m.get('restarts','?')}\n\n"
            f"Insight (1-2 sentences only):"
        )
        resp = self._chat(prompt)
        if resp:
            text = resp["message"]["content"].strip()
            # Limit to 2 sentences
            sentences = [s.strip() for s in text.split(".") if s.strip()]
            return ". ".join(sentences[:2]) + "."
        return self._template(anomaly)

    def _template(self, anomaly):
        fn = TEMPLATES.get(anomaly.get("type"), lambda a: "Anomaly detected. Review pod logs for details.")
        return fn(anomaly)


def get_llm_stats() -> dict:
    return dict(llm_stats)