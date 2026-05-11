from datetime import datetime, timedelta

class MemoryAgent:
    def __init__(self, prometheus_client):
        self.prometheus = prometheus_client
        self.memory_history = {}
        self.memory_threshold = 85
        self.leak_window = 5       # minutes
        self.leak_growth_rate = 2.0  # % per minute

    async def detect(self):
        anomalies = []
        now = datetime.utcnow()

        for pod_name, metrics in self.prometheus.current_metrics.items():
            mem = metrics.get("memory_percent", 0)

            # High memory alert
            if mem > self.memory_threshold:
                anomalies.append({
                    "type": "high_memory",
                    "pod": pod_name,
                    "memory_percent": mem,
                    "threshold": self.memory_threshold,
                    "severity": "high",
                    "message": f"High memory usage on {pod_name}: {mem:.1f}%"
                })

            # Memory leak detection via growth rate
            history = self.memory_history.setdefault(pod_name, [])
            history.append({"timestamp": now, "memory": mem})

            # Prune old entries
            cutoff = now - timedelta(minutes=self.leak_window)
            self.memory_history[pod_name] = [h for h in history if h["timestamp"] >= cutoff]

            history = self.memory_history[pod_name]
            if len(history) >= 3:
                oldest = history[0]
                newest = history[-1]
                time_diff = (newest["timestamp"] - oldest["timestamp"]).total_seconds() / 60
                mem_diff  = newest["memory"] - oldest["memory"]
                if time_diff > 0:
                    growth = mem_diff / time_diff
                    if growth >= self.leak_growth_rate:
                        anomalies.append({
                            "type": "memory_leak",
                            "pod": pod_name,
                            "growth_rate": round(growth, 2),
                            "current_memory": mem,
                            "severity": "critical",
                            "message": f"Memory leak on {pod_name}: growing {growth:.2f}%/min"
                        })
        return anomalies