from datetime import datetime

class CPUAgent:
    def __init__(self, prometheus_client):
        self.prometheus = prometheus_client
        self.spike_threshold = 80
        self.spike_cooldown = 5   # minutes
        self.last_alert_time = {}

    async def detect(self):
        anomalies = []
        for pod_name, metrics in self.prometheus.current_metrics.items():
            cpu = metrics.get("cpu_percent", 0)
            if cpu > self.spike_threshold:
                last = self.last_alert_time.get(pod_name)
                elapsed = (datetime.utcnow() - last).total_seconds() / 60 if last else 999
                if elapsed >= self.spike_cooldown:
                    anomalies.append({
                        "type": "cpu_spike",
                        "pod": pod_name,
                        "cpu_percent": cpu,
                        "threshold": self.spike_threshold,
                        "severity": "high" if cpu > 95 else "medium",
                        "message": f"CPU spike detected on {pod_name}: {cpu:.1f}% (threshold: {self.spike_threshold}%)"
                    })
                    self.last_alert_time[pod_name] = datetime.utcnow()
        return anomalies