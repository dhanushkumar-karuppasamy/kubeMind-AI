class StorageAgent:
    def __init__(self, prometheus_client):
        self.prometheus = prometheus_client
        self.pvc_threshold = 85

    async def detect(self):
        anomalies = []
        try:
            metrics = self.prometheus.current_metrics
            for pod_name, pod_data in metrics.items():
                disk_percent = pod_data.get("disk_percent", 0)
                if disk_percent > self.pvc_threshold:
                    anomalies.append({
                        "type": "storage_pressure",
                        "pod": pod_name,
                        "disk_percent": disk_percent,
                        "severity": "critical" if disk_percent > 95 else "high",
                        "message": f"Pod {pod_name} disk at {disk_percent:.1f}% — storage pressure"
                    })
        except Exception as e:
            print(f"[StorageAgent] Error: {e}")
        return anomalies