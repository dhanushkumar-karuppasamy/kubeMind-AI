class DependencyAgent:
    def __init__(self, prometheus_client):
        self.prometheus = prometheus_client
        self.known_deps = {
            "student-portal":   ["face-recognition", "database"],
            "face-recognition": ["database"],
            "chatbot":          ["database"],
            "notification":     [],
        }

    async def detect(self):
        anomalies = []
        metrics = self.prometheus.current_metrics
        for pod, deps in self.known_deps.items():
            pod_m = metrics.get(pod, {})
            if pod_m.get("restarts", 0) >= 2:
                for dep in deps:
                    dep_m = metrics.get(dep, {})
                    if dep_m.get("cpu_percent", 0) > 60:
                        anomalies.append({
                            "type": "dependency_failure",
                            "pod": dep,
                            "source": pod,
                            "restarts": pod_m["restarts"],
                            "severity": "critical",
                            "message": f"{dep} showing strain due to {pod} instability ({pod_m['restarts']} restarts)"
                        })
        return anomalies

    async def get_dependency_graph(self):
        metrics = self.prometheus.current_metrics
        nodes, edges = [], []
        all_pods = set(self.known_deps.keys())
        for deps in self.known_deps.values():
            all_pods.update(deps)

        for pod in all_pods:
            m = metrics.get(pod, {})
            restarts = m.get("restarts", 0)
            cpu      = m.get("cpu_percent", 0)
            color = "red" if restarts > 0 else ("orange" if cpu > 80 else "green")
            nodes.append({"id": pod, "label": pod.replace("-", " ").title(), "color": color,
                          "health": "unhealthy" if color != "green" else "healthy"})

        for pod, deps in self.known_deps.items():
            for dep in deps:
                edges.append({"source": pod, "target": dep, "type": "calls"})
        return {"nodes": nodes, "edges": edges}