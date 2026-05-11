import aiohttp
import random
from datetime import datetime
import os

PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://localhost:9090")

class PrometheusClient:
    def __init__(self, prometheus_url=PROMETHEUS_URL):
        self.prometheus_url = prometheus_url
        self.current_metrics = {}
        self._connection_error_logged = False

    async def fetch_metrics(self):
        try:
            async with aiohttp.ClientSession() as session:
                cpu_data    = await self._query(session, 'rate(container_cpu_usage_seconds_total{container!=""}[1m]) * 100')
                mem_data    = await self._query(session, 'container_memory_usage_bytes{container!=""}')
                restart_data= await self._query(session, 'kube_pod_container_status_restarts_total')
                netin_data  = await self._query(session, 'rate(container_network_receive_bytes_total[1m])')
                netout_data = await self._query(session, 'rate(container_network_transmit_bytes_total[1m])')

                pod_metrics = {}

                for r in cpu_data:
                    pod = r["metric"].get("pod") or r["metric"].get("container", "unknown")
                    if pod and pod != "unknown":
                        pod_metrics.setdefault(pod, {})
                        pod_metrics[pod]["cpu_percent"] = round(float(r["value"][1]), 2)

                for r in mem_data:
                    pod = r["metric"].get("pod") or r["metric"].get("container", "unknown")
                    if pod and pod in pod_metrics:
                        mem_bytes = float(r["value"][1])
                        pod_metrics[pod]["memory_percent"] = round((mem_bytes / (512 * 1024 * 1024)) * 100, 2)

                for r in restart_data:
                    pod = r["metric"].get("pod", "unknown")
                    if pod in pod_metrics:
                        pod_metrics[pod]["restarts"] = int(float(r["value"][1]))

                for r in netin_data:
                    pod = r["metric"].get("pod", "unknown")
                    if pod in pod_metrics:
                        pod_metrics[pod]["network_in_bytes"] = float(r["value"][1])

                for r in netout_data:
                    pod = r["metric"].get("pod", "unknown")
                    if pod in pod_metrics:
                        pod_metrics[pod]["network_out_bytes"] = float(r["value"][1])

                # Fill defaults
                for pod in pod_metrics:
                    pod_metrics[pod].setdefault("cpu_percent", 0.0)
                    pod_metrics[pod].setdefault("memory_percent", 0.0)
                    pod_metrics[pod].setdefault("restarts", 0)
                    pod_metrics[pod].setdefault("network_in_bytes", 0.0)
                    pod_metrics[pod].setdefault("network_out_bytes", 0.0)
                    pod_metrics[pod]["status"] = "Running"

                if pod_metrics:
                    self.current_metrics = pod_metrics
                else:
                    self._use_mock_data()

        except Exception as e:
            print(f"[PrometheusClient] Error fetching metrics: {e}")
            self._use_mock_data()

        return self.current_metrics

    def _use_mock_data(self):
        """Fallback mock data so dashboard always shows something"""
        pods = ["student-portal", "face-recognition", "database"]
        for pod in pods:
            existing = self.current_metrics.get(pod, {})
            self.current_metrics[pod] = {
                "cpu_percent":       existing.get("cpu_percent", round(random.uniform(10, 40), 2)),
                "memory_percent":    existing.get("memory_percent", round(random.uniform(20, 50), 2)),
                "restarts":          existing.get("restarts", 0),
                "network_in_bytes":  existing.get("network_in_bytes", round(random.uniform(1000, 5000), 2)),
                "network_out_bytes": existing.get("network_out_bytes", round(random.uniform(1000, 5000), 2)),
                "status":            "Running",
            }

    def spike_cpu(self, pod_name):
        """Called by simulate endpoint to fake a CPU spike"""
        if pod_name in self.current_metrics:
            self.current_metrics[pod_name]["cpu_percent"] = round(random.uniform(88, 97), 2)

    def spike_memory(self, pod_name):
        """Called by simulate endpoint to fake memory growth"""
        if pod_name in self.current_metrics:
            current = self.current_metrics[pod_name].get("memory_percent", 40)
            self.current_metrics[pod_name]["memory_percent"] = min(current + random.uniform(3, 6), 99)

    async def _query(self, session, query):
        try:
            url = f"{self.prometheus_url}/api/v1/query"
            async with session.get(url, params={"query": query}, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self._connection_error_logged = False
                    return data.get("data", {}).get("result", [])
        except Exception as e:
            if not self._connection_error_logged:
                print(f"[Prometheus] Connection failed: {e}. Using mock data. (Further errors suppressed)")
                self._connection_error_logged = True
        return []