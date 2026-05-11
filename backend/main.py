from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from metrics.prometheus_client import PrometheusClient
from agents.cpu_agent import CPUAgent
from agents.memory_agent import MemoryAgent
from agents.network_agent import NetworkAgent
from agents.dependency_agent import DependencyAgent
from llm.insight_generator import InsightGenerator

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    task = asyncio.create_task(background_collector())
    print("✅ KubeMind AI Backend started")
    yield
    # Shutdown
    task.cancel()

app = FastAPI(title="KubeMind AI Backend", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Component init ---
prom     = PrometheusClient()
cpu_a    = CPUAgent(prom)
mem_a    = MemoryAgent(prom)
net_a    = NetworkAgent(prom)
dep_a    = DependencyAgent(prom)
llm      = InsightGenerator()

anomaly_history = []
MAX_HISTORY = 200

# --- Background collector ---
async def background_collector():
    while True:
        try:
            await prom.fetch_metrics()
            all_anomalies = (
                await cpu_a.detect() +
                await mem_a.detect() +
                await net_a.detect() +
                await dep_a.detect()
            )
            for anomaly in all_anomalies:
                anomaly["insight"]   = await llm.generate(anomaly, prom.current_metrics)
                anomaly["timestamp"] = datetime.utcnow().isoformat()
                anomaly_history.append(anomaly)
            if len(anomaly_history) > MAX_HISTORY:
                del anomaly_history[:-MAX_HISTORY]
        except Exception as e:
            print(f"[Collector] Error: {e}")
        await asyncio.sleep(10)

# --- Endpoints ---
@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/metrics/current")
async def current_metrics():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": prom.current_metrics,
        "pod_count": len(prom.current_metrics),
    }

@app.get("/api/anomalies/current")
async def current_anomalies():
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    recent = [a for a in anomaly_history
              if datetime.fromisoformat(a["timestamp"]) >= cutoff]
    return {"count": len(recent), "anomalies": recent[-20:], "timestamp": datetime.utcnow().isoformat()}

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

@app.get("/api/recommendations")
async def recommendations():
    recs = []
    for pod, m in prom.current_metrics.items():
        if m.get("cpu_percent", 0) > 80:
            recs.append({"pod": pod, "type": "scaling",
                         "message": f"Consider scaling {pod} — CPU at {m['cpu_percent']}%",
                         "severity": "high"})
        if m.get("memory_percent", 0) > 85:
            recs.append({"pod": pod, "type": "restart",
                         "message": f"Memory leak suspected on {pod} — consider restart",
                         "severity": "critical"})
        if m.get("restarts", 0) > 3:
            recs.append({"pod": pod, "type": "investigate",
                         "message": f"{pod} has restarted {m['restarts']} times — investigate crash logs",
                         "severity": "medium"})
    return {"recommendations": recs, "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/simulate/cpu-spike")
async def simulate_cpu(pod_name: str = "face-recognition"):
    prom.spike_cpu(pod_name)
    return {"status": "success", "message": f"CPU spike triggered on {pod_name}"}

@app.post("/api/simulate/memory-leak")
async def simulate_memory(pod_name: str = "student-portal"):
    for _ in range(5):   # push memory up quickly
        prom.spike_memory(pod_name)
    return {"status": "success", "message": f"Memory spike triggered on {pod_name}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)