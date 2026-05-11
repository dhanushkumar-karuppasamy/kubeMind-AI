import numpy as np
from datetime import datetime

class ForecastingEngine:
    def __init__(self, metric_history):
        self.history = metric_history

    def forecast_cpu(self, pod_name, minutes_ahead=10):
        if pod_name not in self.history:
            return None
        history = self.history[pod_name][-30:]
        if len(history) < 5:
            return None
        values = [h.get("cpu_percent", 0) for h in history]
        X = np.arange(len(values), dtype=float)
        coeffs = np.polyfit(X, values, 1)
        steps_ahead = (minutes_ahead * 60) // 10
        predicted = float(np.poly1d(coeffs)(len(values) + steps_ahead))
        predicted = max(0, min(100, predicted))
        current = values[-1]
        will_exceed = predicted > 80
        trend = "rising" if coeffs[0] > 0.1 else "falling" if coeffs[0] < -0.1 else "stable"
        return {
            "pod": pod_name, "current_cpu": round(current, 1),
            "predicted_cpu": round(predicted, 1),
            "minutes_ahead": minutes_ahead,
            "will_exceed_threshold": will_exceed, "trend": trend,
            "message": (
                f"⚠️ CPU will reach {predicted:.1f}% in {minutes_ahead} min — scale now"
                if will_exceed else
                f"CPU projected at {predicted:.1f}% in {minutes_ahead} min — {trend}"
            )
        }

    def forecast_memory(self, pod_name, minutes_ahead=10):
        if pod_name not in self.history:
            return None
        history = self.history[pod_name][-30:]
        if len(history) < 5:
            return None
        values = [h.get("memory_percent", 0) for h in history]
        X = np.arange(len(values), dtype=float)
        coeffs = np.polyfit(X, values, 1)
        steps_ahead = (minutes_ahead * 60) // 10
        predicted = float(np.poly1d(coeffs)(len(values) + steps_ahead))
        predicted = max(0, min(100, predicted))
        current = values[-1]
        growth_rate = coeffs[0]
        is_leak = growth_rate > 0.5
        minutes_to_oom = None
        if is_leak and growth_rate > 0:
            steps_to_oom = max(0, (95 - current) / growth_rate)
            minutes_to_oom = round((steps_to_oom * 10) / 60, 1)
        return {
            "pod": pod_name, "current_memory": round(current, 1),
            "predicted_memory": round(predicted, 1),
            "minutes_ahead": minutes_ahead,
            "is_memory_leak": is_leak, "will_oom": predicted > 95,
            "minutes_to_oom": minutes_to_oom,
            "message": (
                f"🚨 Memory leak! OOM in ~{minutes_to_oom} min" if is_leak and minutes_to_oom
                else f"Memory at {predicted:.1f}% in {minutes_ahead} min"
            )
        }

    def get_all_forecasts(self):
        result = {"cpu": {}, "memory": {}, "timestamp": datetime.utcnow().isoformat()}
        for pod_name in self.history.keys():
            cf = self.forecast_cpu(pod_name)
            mf = self.forecast_memory(pod_name)
            if cf: result["cpu"][pod_name] = cf
            if mf: result["memory"][pod_name] = mf
        return result