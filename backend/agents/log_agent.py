class LogAgent:
    def __init__(self, prometheus_client):
        self.prometheus = prometheus_client
        self.error_threshold = 5

    async def detect(self):
        anomalies = []
        try:
            metrics = self.prometheus.current_metrics
            for pod_name, pod_data in metrics.items():
                error_count = pod_data.get("error_count", 0)
                restart_count = pod_data.get("restart_count", 0)
                if error_count > self.error_threshold:
                    anomalies.append({
                        "type": "log_errors", "pod": pod_name,
                        "error_count": error_count,
                        "severity": "critical" if error_count > 20 else "high",
                        "message": f"{pod_name} has {error_count} errors in logs"
                    })
                if restart_count >= 3:
                    anomalies.append({
                        "type": "crash_loop", "pod": pod_name,
                        "restart_count": restart_count, "severity": "critical",
                        "message": f"{pod_name} restarted {restart_count} times — CrashLoopBackOff risk"
                    })
        except Exception as e:
            print(f"[LogAgent] Error: {e}")
        return anomalies