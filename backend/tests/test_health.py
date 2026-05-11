import asyncio
import pytest

from backend import main


@pytest.mark.asyncio
async def test_health_score_no_metrics(monkeypatch):
    # Ensure empty metrics returns perfect score
    main.prom.current_metrics = {}
    main.anomaly_history.clear()
    res = await main.health_score()
    assert res["score"] == 100
    assert res["grade"] == "A"


@pytest.mark.asyncio
async def test_health_score_with_anomalies(monkeypatch):
    # Setup sample metrics and anomalies
    main.prom.current_metrics = {"pod-a": {"cpu_percent": 10}}
    main.anomaly_history.clear()
    # Add one critical and one medium
    main.anomaly_history.append({"severity": "critical", "timestamp": "2020-01-01T00:00:00"})
    main.anomaly_history.append({"severity": "medium", "timestamp": "2020-01-01T00:00:00"})

    res = await main.health_score()
    # deductions = 15 (critical) + 3 (medium) = 18 -> score = 82
    assert res["score"] == 82
    assert res["grade"] == "B"
