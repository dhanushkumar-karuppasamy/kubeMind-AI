# PATH: backend/main.py — REPLACE ENTIRELY

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional
import uuid

from metrics.prometheus_client import PrometheusClient
from agents.cpu_agent import CPUAgent
from agents.memory_agent import MemoryAgent
from agents.network_agent import NetworkAgent
from agents.dependency_agent import DependencyAgent
from agents.storage_agent import StorageAgent
from agents.io_agent import IOAgent
from agents.log_agent import LogAgent
from llm.insight_generator import InsightGenerator
from recommendations import RecommendationEngine
from forecasting import ForecastingEngine
from correlation import CorrelationAnalyzer
from chaos_engine import ChaosEngine


# ── Globals ──────────────────────────────────────────────────
prom         = PrometheusClient()
cpu_a        = CPUAgent(prom)
mem_a        = MemoryAgent(prom)
net_a        = NetworkAgent(prom)
dep_a        = DependencyAgent(prom)
storage_a    = StorageAgent(prom)
io_a         = IOAgent(prom)
log_a        = LogAgent(prom)
llm          = InsightGenerator()
chaos        = ChaosEngine(prom)

anomaly_history  = []
metric_history   = {}   # { pod_name: [ {cpu, mem, ts, ...}, ... ] }
activity_feed    = []   # live activity log shown on dashboard
MAX_HISTORY      = 300
MAX_METRIC_PTS   = 60   # 60 × 10s = 10 minutes of history
MAX_ACTIVITY     = 50
MAX_CONFIG_EVENTS = 100

# In-memory config/deployment events for timeline correlation
config_events = []  # list of dicts with keys: id, timestamp, type, service, title, description, severity


class ConfigEventIn(BaseModel):
    type: str
    service: str
    title: str
    description: Optional[str] = None
    severity: Optional[str] = "info"


# ── Lifespan ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(background_collector())
    print("[OK] KubeMind AI Backend started")
    yield
    task.cancel()
    chaos.stop()


app = FastAPI(title="KubeMind AI Backend", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Background collector ───────────────────────────────────────
async def background_collector():
    while True:
        try:
            await prom.fetch_metrics()

            # Store rolling metric history per pod
            for pod_name, pod_data in prom.current_metrics.items():
                if pod_name not in metric_history:
                    metric_history[pod_name] = []
                metric_history[pod_name].append({
                    **pod_data,
                    "timestamp": datetime.utcnow().isoformat()
                })
                if len(metric_history[pod_name]) > MAX_METRIC_PTS:
                    metric_history[pod_name] = metric_history[pod_name][-MAX_METRIC_PTS:]

            # Run all agents
            all_anomalies = (
                await cpu_a.detect() +
                await mem_a.detect() +
                await net_a.detect() +
                await dep_a.detect() +
                await storage_a.detect() +
                await io_a.detect() +
                await log_a.detect()
            )

            for anomaly in all_anomalies:
                anomaly["insight"]   = await llm.generate(anomaly, prom.current_metrics)
                anomaly["timestamp"] = datetime.utcnow().isoformat()
                anomaly_history.append(anomaly)

                # Push to activity feed
                activity_feed.append({
                    "pod":      anomaly.get("pod", "unknown"),
                    "type":     anomaly.get("type", "anomaly"),
                    "severity": anomaly.get("severity", "medium"),
                    "message":  anomaly.get("message", ""),
                    "insight":  anomaly.get("insight", ""),
                    "timestamp": anomaly["timestamp"],
                    "icon": _severity_icon(anomaly.get("severity", "medium"))
                })

            if len(anomaly_history) > MAX_HISTORY:
                del anomaly_history[:-MAX_HISTORY]
            if len(activity_feed) > MAX_ACTIVITY:
                del activity_feed[:-MAX_ACTIVITY]

        except Exception as e:
            print(f"[Collector] Error: {e}")

        await asyncio.sleep(10)


def _severity_icon(severity: str) -> str:
    return {"critical": "🚨", "high": "⚠️", "medium": "⚡", "low": "ℹ️"}.get(severity, "⚡")


# ── Existing endpoints (unchanged) ───────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/metrics/current")
async def current_metrics():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "metrics":   prom.current_metrics,
        "pod_count": len(prom.current_metrics),
    }


@app.get("/api/anomalies/current")
async def current_anomalies():
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    recent = [a for a in anomaly_history
              if datetime.fromisoformat(a["timestamp"]) >= cutoff]
    return {"count": len(recent), "anomalies": recent[-20:],
            "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/anomalies/history")
async def anomaly_history_endpoint(hours: int = 1):
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    filtered = [a for a in anomaly_history
                if datetime.fromisoformat(a["timestamp"]) >= cutoff]
    timeline = {}
    for a in filtered:
        key = datetime.fromisoformat(a["timestamp"]).strftime("%H:%M")
        timeline.setdefault(key, {"count": 0, "anomalies": []})
        timeline[key]["count"] += 1
        timeline[key]["anomalies"].append(a)
    return {"timeline": timeline}


@app.get("/api/dependencies")
async def dependencies():
    graph = await dep_a.get_dependency_graph()
    return {**graph, "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/simulate/cpu-spike")
async def simulate_cpu(pod_name: str = "face-recognition"):
    prom.spike_cpu(pod_name)
    return {"status": "success", "message": f"CPU spike triggered on {pod_name}"}


@app.post("/api/simulate/memory-leak")
async def simulate_memory(pod_name: str = "student-portal"):
    for _ in range(5):
        prom.spike_memory(pod_name)
    return {"status": "success", "message": f"Memory spike triggered on {pod_name}"}


# ── New endpoints ─────────────────────────────────────────────

@app.get("/api/recommendations")
async def recommendations():
    engine = RecommendationEngine(
        metrics=prom.current_metrics,
        anomalies=anomaly_history[-20:],
        dependencies=None
    )
    recs = engine.generate()
    return {"recommendations": recs, "count": len(recs),
            "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/health-score")
async def health_score():
    if not prom.current_metrics:
        return {"score": 100, "grade": "A", "status": "No pods yet",
                "breakdown": {}, "timestamp": datetime.utcnow().isoformat()}

    cutoff = datetime.utcnow() - timedelta(minutes=5)
    recent = [a for a in anomaly_history
              if datetime.fromisoformat(a["timestamp"]) >= cutoff]

    breakdown = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for a in recent:
        sev = a.get("severity", "low")
        breakdown[sev] = breakdown.get(sev, 0) + 1

    deductions = (breakdown["critical"] * 15 +
                  breakdown["high"] * 8 +
                  breakdown["medium"] * 3 +
                  breakdown["low"] * 1)
    score = max(0, min(100, 100 - deductions))
    grade = "A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "D" if score >= 60 else "F"
    status = ("Excellent" if score >= 90 else "Good" if score >= 80
              else "Degraded" if score >= 70 else "Poor" if score >= 60 else "Critical")

    return {"score": score, "grade": grade, "status": status,
            "breakdown": breakdown, "pod_count": len(prom.current_metrics),
            "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/forecast")
async def forecast():
    if not metric_history:
        return {"forecasts": {}, "message": "Need more data — wait 30 seconds",
                "timestamp": datetime.utcnow().isoformat()}
    engine = ForecastingEngine(metric_history)
    forecasts = engine.get_all_forecasts()
    return {**forecasts, "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/correlations")
async def correlations():
    if not metric_history:
        return {"correlations": {}, "message": "Need more data — wait 30 seconds",
                "timestamp": datetime.utcnow().isoformat()}
    analyzer = CorrelationAnalyzer(metric_history)
    matrix = analyzer.calculate_correlation_matrix()
    return {"correlations": matrix, "count": len(matrix),
            "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/activity")
async def activity():
    return {"events": list(reversed(activity_feed)),
            "count": len(activity_feed),
            "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/chaos/enable")
async def chaos_enable():
    if not chaos.enabled:
        asyncio.create_task(chaos.start_random_simulation())
    return {"status": "enabled", "message": "Chaos engine running — random anomalies every 30-50 seconds"}


@app.post("/api/chaos/disable")
async def chaos_disable():
    chaos.stop()
    return {"status": "disabled", "message": "Chaos engine stopped"}


@app.get("/api/chaos/status")
async def chaos_status():
    return chaos.get_status()


@app.post("/api/chaos/inject")
async def chaos_inject(pod_name: str, anomaly_type: str = "cpu_spike", duration: int = 60):
    result = await chaos.inject_anomaly(pod_name, anomaly_type, duration)
    return result


@app.get("/api/summary/dependencies")
async def summary_dependencies():
    """LLM-generated summary of service dependencies."""
    pods = list(prom.current_metrics.keys())
    if not pods:
        return {"summary": "No pods detected yet.", "pods": []}
    
    metrics_text = "\n".join([
        f"- {pod}: CPU {prom.current_metrics[pod].get('cpu_percent', 0):.1f}%, "
        f"Memory {prom.current_metrics[pod].get('memory_percent', 0):.1f}%"
        for pod in pods
    ])
    
    prompt = f"Give a short 2-sentence summary of these service dependencies: {metrics_text}"
    try:
        summary = llm.generate_insight(prompt)
        return {"summary": summary, "pods": pods, "count": len(pods)}
    except:
        return {"summary": f"Running {len(pods)} services: {', '.join(pods)}", "pods": pods, "count": len(pods)}


@app.get("/api/summary/health")
async def summary_health():
    """LLM-generated summary of cluster health."""
    recent_anomalies = [a for a in anomaly_history 
                       if datetime.fromisoformat(a["timestamp"]) >= datetime.utcnow() - timedelta(minutes=10)]
    
    if not recent_anomalies:
        summary = "All systems operating normally. No anomalies detected in the last 10 minutes."
    else:
        anomaly_text = ", ".join([f"{a['type']} on {a['pod']}" for a in recent_anomalies[:5]])
        prompt = f"Summarize in 1 sentence the health impact of: {anomaly_text}"
        try:
            summary = llm.generate_insight(prompt)
        except:
            summary = f"Detected {len(recent_anomalies)} anomalies in last 10 minutes: {anomaly_text}"
    
    return {"summary": summary, "anomaly_count": len(recent_anomalies), "status": "healthy" if len(recent_anomalies) < 3 else "degraded"}


@app.get("/api/summary/correlations")
async def summary_correlations():
    fallback_bullets = [
        "CPU usage on face-recognition is strongly linked to student-portal traffic.",
        "Memory usage across pods is currently independent, suggesting no shared leak.",
        "Network spikes on one pod do not appear to affect others significantly."
    ]

    if not metric_history:
        return {"bullets": fallback_bullets, "generated_at": datetime.utcnow().isoformat()}

    analyzer = CorrelationAnalyzer(metric_history)
    matrix = analyzer.calculate_correlation_matrix()
    if not matrix:
        return {"bullets": fallback_bullets, "generated_at": datetime.utcnow().isoformat()}

    compact_pairs = []
    for _, item in list(matrix.items())[:5]:
        compact_pairs.append({
            "pods": f"{item.get('pod1')} ↔ {item.get('pod2')}",
            "type": item.get("type"),
            "strength": item.get("strength"),
            "correlation": item.get("correlation"),
            "meaning": item.get("meaning"),
        })

    prompt = (
        f"Given these metric correlations between pods: {json.dumps(compact_pairs, ensure_ascii=False)}\n"
        "Explain in 3 plain-English bullet points what this means for cluster operations."
    )

    try:
        bullets = llm.generate_bullets(prompt, fallback_bullets)
        bullets = [b.strip() for b in bullets if b and b.strip()][:3]
    except Exception as e:
        print(f"[LLM] Correlation summary fallback used: {e}")
        bullets = fallback_bullets

    if len(bullets) < 3:
        bullets = (bullets + fallback_bullets)[:3]

    return {"bullets": bullets, "generated_at": datetime.utcnow().isoformat()}


@app.get("/api/signals/golden")
async def golden_signals():
    """Compute lightweight golden signals for demo: throughput (rps), error rate (%), avg latency (ms).
    Values are derived from current metrics and recent anomalies to remain stable and demo-friendly.
    """
    # Collect basic stats
    pods = list(prom.current_metrics.keys())
    if not pods:
        # fallback stable demo values
        return {
            "throughput_rps": 5.0,
            "error_rate_pct": 0.5,
            "avg_latency_ms": 120,
            "status": "healthy",
            "updated_at": datetime.utcnow().isoformat()
        }

    # Throughput: sum of network_in_bytes + network_out_bytes (these are rates bytes/sec), divide by 1000 bytes/request
    total_bytes_per_sec = 0.0
    cpu_vals = []
    mem_vals = []
    for p in pods:
        m = prom.current_metrics.get(p, {})
        total_bytes_per_sec += m.get("network_in_bytes", 0.0) + m.get("network_out_bytes", 0.0)
        cpu_vals.append(m.get("cpu_percent", 0.0))
        mem_vals.append(m.get("memory_percent", 0.0))

    # Derive throughput rps using a nominal request size of 1000 bytes
    throughput_rps = round(total_bytes_per_sec / 1000.0, 2)

    # Error rate: base 0.5%, increase with number of recent critical anomalies
    cutoff = datetime.utcnow() - timedelta(minutes=10)
    recent = [a for a in anomaly_history if datetime.fromisoformat(a["timestamp"]) >= cutoff]
    critical_count = sum(1 for a in recent if a.get("severity") == "critical")
    error_rate_pct = 0.5 + critical_count * 1.5

    # Latency: base plus contributions from avg CPU and memory
    avg_cpu = sum(cpu_vals) / len(cpu_vals) if cpu_vals else 20.0
    avg_mem = sum(mem_vals) / len(mem_vals) if mem_vals else 30.0
    avg_latency_ms = int(round(80 + avg_cpu * 1.2 + (avg_mem / 100.0) * 200))

    # Status thresholds
    status = "healthy"
    if error_rate_pct > 5 or avg_latency_ms > 800:
        status = "critical"
    elif error_rate_pct > 2.5 or avg_latency_ms > 300:
        status = "warning"

    return {
        "throughput_rps": throughput_rps,
        "error_rate_pct": round(error_rate_pct, 2),
        "avg_latency_ms": avg_latency_ms,
        "status": status,
        "updated_at": datetime.utcnow().isoformat()
    }


# -----------------------------
# Config events endpoints
# -----------------------------


@app.post("/api/events/config")
async def post_config_event(payload: ConfigEventIn):
    """Create a config/deployment event and append to in-memory list."""
    event = {
        "id": uuid.uuid4().hex,
        "timestamp": datetime.utcnow().isoformat(),
        "type": payload.type,
        "service": payload.service,
        "title": payload.title,
        "description": payload.description or "",
        "severity": payload.severity or "info",
    }
    config_events.append(event)
    # keep most recent MAX_CONFIG_EVENTS
    if len(config_events) > MAX_CONFIG_EVENTS:
        del config_events[:-MAX_CONFIG_EVENTS]
    return event


@app.get("/api/events/config")
async def get_config_events(hours: int = 1):
    """Return config events within the last `hours` hours, newest first."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    filtered = [e for e in config_events if datetime.fromisoformat(e["timestamp"]) >= cutoff]
    # newest first
    filtered.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"count": len(filtered), "events": filtered, "timestamp": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)