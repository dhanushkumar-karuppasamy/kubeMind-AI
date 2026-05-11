class RecommendationEngine:
    def __init__(self, metrics, anomalies, dependencies=None):
        self.metrics = metrics
        self.anomalies = anomalies
        self.dependencies = dependencies or {}

    def generate(self):
        recommendations = []

        for pod, pod_metrics in self.metrics.items():
            cpu = pod_metrics.get("cpu_percent", 0)
            memory = pod_metrics.get("memory_percent", 0)
            if cpu > 80 and memory > 70:
                recommendations.append({
                    "priority": "critical", "type": "scaling", "pod": pod,
                    "action": f"Scale {pod} immediately — CPU {cpu:.0f}%, Memory {memory:.0f}%",
                    "expected_benefit": "Prevent crash and service degradation",
                    "estimated_time": "5 minutes",
                    "kubectl_command": f"kubectl scale deployment {pod} --replicas=3 -n kubemind-demo"
                })
            elif cpu > 60:
                recommendations.append({
                    "priority": "high", "type": "scaling", "pod": pod,
                    "action": f"Consider scaling {pod} — CPU at {cpu:.0f}%",
                    "expected_benefit": "Improve response time",
                    "estimated_time": "10 minutes",
                    "kubectl_command": f"kubectl scale deployment {pod} --replicas=2 -n kubemind-demo"
                })

        for anomaly in self.anomalies:
            if anomaly.get("type") == "memory_leak":
                pod = anomaly.get("pod", "unknown")
                recommendations.append({
                    "priority": "critical", "type": "restart", "pod": pod,
                    "action": f"Restart {pod} — memory leak detected",
                    "expected_benefit": "Free leaked memory",
                    "estimated_time": "1 minute",
                    "kubectl_command": f"kubectl rollout restart deployment/{pod} -n kubemind-demo"
                })
            if anomaly.get("type") == "crash_loop":
                pod = anomaly.get("pod", "unknown")
                recommendations.append({
                    "priority": "critical", "type": "investigate", "pod": pod,
                    "action": f"Investigate {pod} — crash loop detected",
                    "expected_benefit": "Stop restart cycle",
                    "estimated_time": "10-30 minutes",
                    "kubectl_command": f"kubectl logs {pod} -n kubemind-demo --previous"
                })

        if not recommendations:
            recommendations.append({
                "priority": "low", "type": "info", "pod": "all",
                "action": "System running optimally — no action required",
                "expected_benefit": "Maintain performance",
                "estimated_time": "N/A",
                "kubectl_command": None
            })

        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        recommendations.sort(key=lambda x: priority_order.get(x["priority"], 4))
        return recommendations[:10]