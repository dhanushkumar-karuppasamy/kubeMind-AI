import numpy as np

class CorrelationAnalyzer:
    def __init__(self, metric_history):
        self.history = metric_history

    def calculate_correlation_matrix(self):
        pods = list(self.history.keys())
        correlations = {}
        checked = set()
        for i, pod1 in enumerate(pods):
            for j, pod2 in enumerate(pods):
                if i >= j:
                    continue
                key = f"{pod1} ↔ {pod2}"
                if key in checked:
                    continue
                checked.add(key)
                h1 = self.history[pod1][-30:]
                h2 = self.history[pod2][-30:]
                min_len = min(len(h1), len(h2))
                if min_len < 5:
                    continue
                cpu1 = np.array([h.get("cpu_percent", 0) for h in h1[-min_len:]])
                cpu2 = np.array([h.get("cpu_percent", 0) for h in h2[-min_len:]])
                if np.std(cpu1) == 0 or np.std(cpu2) == 0:
                    continue
                corr = float(np.corrcoef(cpu1, cpu2)[0, 1])
                if abs(corr) < 0.6:
                    continue
                strength = "very strong" if abs(corr) > 0.9 else "strong" if abs(corr) > 0.75 else "moderate"
                direction = "positive" if corr > 0 else "negative"
                meaning = (
                    f"{pod1} and {pod2} load rises together — same traffic source"
                    if corr > 0.8 else
                    f"When {pod1} is busy, {pod2} is idle — possible failover"
                    if corr < -0.8 else
                    f"{pod1} and {pod2} have related workloads"
                )
                correlations[key] = {
                    "pod1": pod1, "pod2": pod2,
                    "correlation": round(corr, 3),
                    "strength": strength, "type": direction,
                    "meaning": meaning,
                    "percentage": round(abs(corr) * 100)
                }
        return dict(sorted(correlations.items(), key=lambda x: abs(x[1]["correlation"]), reverse=True))