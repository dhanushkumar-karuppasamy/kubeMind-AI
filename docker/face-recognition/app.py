from flask import Flask, jsonify, request
import threading
import time
import random
import os

app = Flask(__name__)

# Shared mutable state
state = {
    "cpu_intensity":    0.0,   # 0.0 = idle, 1.0 = full burn
    "spike_until":      0,
    "total_processed":  0,
    "response_times":   [],
    "memory_store":     [],    # grows during memory leak simulation
    "leak_active":      False,
    "leak_until":       0,
}

def cpu_burner():
    """Background thread that burns CPU when intensity > 0"""
    while True:
        intensity = state["cpu_intensity"]
        if time.time() < state["spike_until"] and intensity > 0:
            # Burn CPU proportional to intensity
            end = time.time() + (intensity * 0.8)
            while time.time() < end:
                _ = sum(i * i for i in range(5000))
        else:
            state["cpu_intensity"] = 0.0
        time.sleep(0.1)

def memory_leaker():
    """Background thread that slowly grows memory"""
    while True:
        if state["leak_active"] and time.time() < state["leak_until"]:
            # Append ~1MB of data every second
            state["memory_store"].append("x" * 1024 * 512)
            if len(state["memory_store"]) > 200:
                state["memory_store"] = state["memory_store"][-200:]
        elif time.time() >= state["leak_until"] and state["leak_active"]:
            state["leak_active"] = False
            state["memory_store"].clear()
        time.sleep(1)

# Start background threads
threading.Thread(target=cpu_burner,   daemon=True).start()
threading.Thread(target=memory_leaker, daemon=True).start()

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "service": "face-recognition"})

@app.route("/process", methods=["POST"])
def process_image():
    data = request.json or {}
    intensity = float(data.get("intensity", 0.3))
    start = time.time()

    # Simulate variable processing time based on load
    base_time = 0.05 + (intensity * 0.2)
    if state["cpu_intensity"] > 0.5:
        base_time *= 3  # slower when under spike
    time.sleep(base_time + random.uniform(0, 0.02))

    elapsed = (time.time() - start) * 1000
    state["total_processed"] += 1
    state["response_times"].append(elapsed)
    if len(state["response_times"]) > 100:
        state["response_times"].pop(0)

    return jsonify({
        "student_id":    data.get("student_id", "unknown"),
        "processed":     True,
        "confidence":    round(random.uniform(0.85, 0.99), 3),
        "time_ms":       round(elapsed, 2),
    })

@app.route("/metrics")
def metrics():
    times = state["response_times"]
    avg_rt = sum(times) / len(times) if times else 0
    return jsonify({
        "total_processed":    state["total_processed"],
        "avg_response_ms":    round(avg_rt, 2),
        "cpu_intensity":      state["cpu_intensity"],
        "memory_chunks":      len(state["memory_store"]),
        "leak_active":        state["leak_active"],
    })

@app.route("/simulate", methods=["POST"])
def simulate():
    data = request.json or {}
    sim_type = data.get("type", "")

    if sim_type == "cpu_spike":
        state["cpu_intensity"] = 1.0
        state["spike_until"]   = time.time() + 90  # 90-second spike
        return jsonify({"message": "CPU spike started for 90 seconds"})

    if sim_type == "memory_leak":
        state["leak_active"] = True
        state["leak_until"]  = time.time() + 120  # 2-minute leak
        return jsonify({"message": "Memory leak simulation started for 2 minutes"})

    if sim_type == "reset":
        state["cpu_intensity"] = 0.0
        state["spike_until"]   = 0
        state["leak_active"]   = False
        state["memory_store"].clear()
        return jsonify({"message": "All simulations reset"})

    return jsonify({"message": "Unknown type. Use: cpu_spike, memory_leak, reset"}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, threaded=True)