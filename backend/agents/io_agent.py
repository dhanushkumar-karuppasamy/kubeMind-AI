class IOAgent:
    def __init__(self, prometheus_client):
        self.prometheus = prometheus_client
        self.io_spike_threshold = 1000
        self.io_critical_threshold = 2000

    async def detect(self):
        anomalies = []
        try:
            metrics = self.prometheus.current_metrics
            for pod_name, pod_data in metrics.items():
                read_ops = pod_data.get("read_iops", 0)
                write_ops = pod_data.get("write_iops", 0)
                total_ops = read_ops + write_ops
                if total_ops > self.io_spike_threshold:
                    anomalies.append({
                        "type": "io_spike",
                        "pod": pod_name,
                        "total_iops": total_ops,
                        "severity": "critical" if total_ops > self.io_critical_threshold else "high",
                        "message": f"High I/O on {pod_name}: {total_ops:.0f} IOPS"
                    })
        except Exception as e:
            print(f"[IOAgent] Error: {e}")
        return anomalies