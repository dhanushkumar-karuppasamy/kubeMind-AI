import asyncio, random
from datetime import datetime

class ChaosEngine:
    def __init__(self, prometheus_client):
        self.prometheus = prometheus_client
        self.enabled = False
        self.active_chaos = []
        self.injection_count = 0

    async def start_random_simulation(self):
        self.enabled = True
        print("[ChaosEngine] Started - injecting anomalies every 30-50 seconds")
        while self.enabled:
            try:
                await asyncio.sleep(random.randint(30, 50))  # 30-50 seconds for fast demo
                if not self.enabled:
                    break
                pods = list(self.prometheus.current_metrics.keys())
                if not pods:
                    continue
                target = random.choice(pods)
                atype = random.choice(["cpu_spike", "memory_leak", "network_burst", "io_spike"])
                await self.inject_anomaly(target, atype)
                self.injection_count += 1
                print(f"[ChaosEngine] Injected {atype} on {target} (total: {self.injection_count})")
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[ChaosEngine] Error: {e}")
                await asyncio.sleep(10)

    async def inject_anomaly(self, pod_name, anomaly_type, duration=60):
        if pod_name not in self.prometheus.current_metrics:
            return {"status": "error", "message": f"Pod {pod_name} not found"}
        self.active_chaos.append({"pod": pod_name, "type": anomaly_type,
                                   "start_time": datetime.utcnow().isoformat()})
        m = self.prometheus.current_metrics[pod_name]
        if anomaly_type == "cpu_spike":
            m["cpu_percent"] = random.uniform(88, 97)
        elif anomaly_type == "memory_leak":
            m["memory_percent"] = min(95, m.get("memory_percent", 40) + random.uniform(20, 35))
        elif anomaly_type == "network_burst":
            m["network_in"] = random.uniform(80000000, 120000000)
        elif anomaly_type == "io_spike":
            m["read_iops"] = random.uniform(800, 1500)
            m["write_iops"] = random.uniform(600, 1200)
        asyncio.create_task(self._auto_recover(pod_name, anomaly_type, duration))
        return {"status": "injected", "pod": pod_name, "type": anomaly_type, "duration": duration}

    async def _auto_recover(self, pod_name, anomaly_type, duration):
        await asyncio.sleep(duration)
        if pod_name not in self.prometheus.current_metrics:
            return
        m = self.prometheus.current_metrics[pod_name]
        if anomaly_type == "cpu_spike":
            m["cpu_percent"] = random.uniform(15, 40)
        elif anomaly_type == "memory_leak":
            m["memory_percent"] = random.uniform(30, 55)
        elif anomaly_type == "network_burst":
            m["network_in"] = random.uniform(1000000, 5000000)
        elif anomaly_type == "io_spike":
            m["read_iops"] = random.uniform(50, 200)
            m["write_iops"] = random.uniform(30, 150)

    def stop(self):
        self.enabled = False

    def get_status(self):
        return {"enabled": self.enabled, "total_injections": self.injection_count,
                "recent_events": self.active_chaos[-10:]}