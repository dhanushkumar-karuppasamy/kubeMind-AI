import pytest

from backend import main


@pytest.mark.asyncio
async def test_cpu_agent_detects_spike():
    # Prepare a pod with high CPU
    main.prom.current_metrics = {"face-recognition": {"cpu_percent": 92.5}}
    # Ensure last_alert_time is cleared so detection is allowed
    main.cpu_a.last_alert_time.clear()

    anomalies = await main.cpu_a.detect()
    assert isinstance(anomalies, list)
    assert len(anomalies) >= 1
    a = anomalies[0]
    assert a["type"] == "cpu_spike"
    assert a["pod"] == "face-recognition"
    assert a["severity"] in ("medium", "high")
