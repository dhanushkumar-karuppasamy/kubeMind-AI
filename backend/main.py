# PATH: backend/main.py — REPLACE ENTIRELY

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

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
    return {"status": "enabled", "message": "Chaos engine running — random anomalies every 2-5 min"}


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)