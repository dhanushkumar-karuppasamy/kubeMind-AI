class NetworkAgent:
    def __init__(self, prometheus_client):
        self.prometheus = prometheus_client
        self.baseline = {}
        self.spike_multiplier = 3
        self.learning_samples = 5

    async def detect(self):
        anomalies = []
        for pod_name, metrics in self.prometheus.current_metrics.items():
            net_in  = metrics.get("network_in_bytes", 0)
            net_out = metrics.get("network_out_bytes", 0)

            b = self.baseline.setdefault(pod_name, {"samples": [], "in": 0, "out": 0})
            b["samples"].append({"in": net_in, "out": net_out})
            if len(b["samples"]) > self.learning_samples:
                b["samples"].pop(0)
            b["in"]  = sum(s["in"]  for s in b["samples"]) / len(b["samples"])
            b["out"] = sum(s["out"] for s in b["samples"]) / len(b["samples"])

            if b["in"] > 0 and net_in / b["in"] > self.spike_multiplier:
                anomalies.append({
                    "type": "network_spike_inbound",
                    "pod": pod_name,
                    "current": net_in,
                    "baseline": b["in"],
                    "multiplier": round(net_in / b["in"], 1),
                    "severity": "medium",
                    "message": f"Inbound traffic spike on {pod_name}: {net_in/b['in']:.1f}x baseline"
                })
            if b["out"] > 0 and net_out / b["out"] > self.spike_multiplier:
                anomalies.append({
                    "type": "network_spike_outbound",
                    "pod": pod_name,
                    "current": net_out,
                    "baseline": b["out"],
                    "multiplier": round(net_out / b["out"], 1),
                    "severity": "medium",
                    "message": f"Outbound traffic spike on {pod_name}: {net_out/b['out']:.1f}x baseline"
                })
        return anomalies