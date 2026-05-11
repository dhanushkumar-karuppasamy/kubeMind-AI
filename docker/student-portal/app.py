from flask import Flask, jsonify, request
import requests
import threading
import time
import random
import os

app = Flask(__name__)

FACE_RECOGNITION_URL = os.getenv("FACE_RECOGNITION_URL", "http://face-recognition:5000")
REQUEST_RATE = int(os.getenv("REQUEST_RATE", "5"))  # requests per cycle

# Shared state
state = {
    "total_requests": 0,
    "successful": 0,
    "failed": 0,
    "response_times": [],
    "load_spike_until": 0,
}

def background_load_generator():
    """Continuously sends attendance processing requests to face-recognition"""
    while True:
        try:
            rate = REQUEST_RATE
            if time.time() < state["load_spike_until"]:
                rate = REQUEST_RATE * 5  # 5x spike

            for _ in range(rate):
                start = time.time()
                try:
                    resp = requests.post(
                        f"{FACE_RECOGNITION_URL}/process",
                        json={"student_id": random.randint(1000, 9999),
                              "intensity": 0.3},
                        timeout=3
                    )
                    elapsed = (time.time() - start) * 1000
                    state["response_times"].append(elapsed)
                    if len(state["response_times"]) > 50:
                        state["response_times"].pop(0)
                    if resp.status_code == 200:
                        state["successful"] += 1
                    else:
                        state["failed"] += 1
                except Exception:
                    state["failed"] += 1
                state["total_requests"] += 1

            time.sleep(1)
        except Exception as e:
            print(f"[LoadGen] Error: {e}")
            time.sleep(2)

# Start background load generator
t = threading.Thread(target=background_load_generator, daemon=True)
t.start()

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "service": "student-portal"})

@app.route("/metrics")
def metrics():
    times = state["response_times"]
    avg_rt = sum(times) / len(times) if times else 0
    return jsonify({
        "total_requests": state["total_requests"],
        "successful":     state["successful"],
        "failed":         state["failed"],
        "avg_response_time_ms": round(avg_rt, 2),
        "requests_per_sec": REQUEST_RATE,
    })

@app.route("/attendance", methods=["POST"])
def process_attendance():
    data = request.json or {}
    student_id = data.get("student_id", random.randint(1000, 9999))
    try:
        resp = requests.post(
            f"{FACE_RECOGNITION_URL}/process",
            json={"student_id": student_id, "intensity": 0.5},
            timeout=5
        )
        return jsonify({"student_id": student_id, "status": "processed",
                        "face_result": resp.json()})
    except Exception as e:
        return jsonify({"student_id": student_id, "status": "error",
                        "error": str(e)}), 500

@app.route("/simulate", methods=["POST"])
def simulate():
    data = request.json or {}
    sim_type = data.get("type", "")
    if sim_type == "load_spike":
        state["load_spike_until"] = time.time() + 60  # 60-second spike
        return jsonify({"message": "Load spike started for 60 seconds"})
    return jsonify({"message": "Unknown simulation type"}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, threaded=True)