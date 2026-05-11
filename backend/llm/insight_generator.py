import os
import re

import ollama

MODEL_NAME = os.getenv("OLLAMA_MODEL", "phi3.5:latest")

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

    def generate_insight(self, prompt: str) -> str:
        try:
            resp = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            text = resp["message"]["content"].strip()
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
            if not sentences:
                return text
            return " ".join(sentences[:2]).strip()
        except Exception as e:
            print(f"[LLM] Fallback used: {e}")
            return "LLM unavailable. Review the related metrics and logs for more detail."

    def generate_bullets(self, prompt: str, fallback_bullets: list[str]) -> list[str]:
        try:
            resp = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            text = resp["message"]["content"].strip()
            bullets = []
            for line in text.splitlines():
                cleaned = line.strip().lstrip("-*•").strip()
                if cleaned:
                    bullets.append(cleaned)

            if not bullets:
                bullets = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]

            return bullets[:3] if bullets else fallback_bullets
        except Exception as e:
            print(f"[LLM] Fallback used: {e}")
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
        try:
            resp = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            text = resp["message"]["content"].strip()
            # Limit to 2 sentences
            sentences = [s.strip() for s in text.split(".") if s.strip()]
            return ". ".join(sentences[:2]) + "."
        except Exception as e:
            print(f"[LLM] Fallback used: {e}")
            return self._template(anomaly)

    def _template(self, anomaly):
        fn = TEMPLATES.get(anomaly.get("type"), lambda a: "Anomaly detected. Review pod logs for details.")
        return fn(anomaly)