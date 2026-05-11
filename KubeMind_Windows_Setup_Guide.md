# KubeMind AI — Windows Setup & Implementation Guide
### From Zero to Demo: VS Code + Windows Step-by-Step

---

## Overview

This guide walks you through the **complete KubeMind AI project setup on Windows** using VS Code — from installing every tool to writing code to recording your demo. It is fully self-contained and follows the mentor's recommendations from your project guide documents.

**Stack:** Python (FastAPI backend) + React (frontend) + Minikube (Kubernetes) + Prometheus + Ollama (local LLM)

**Timeline:** 9 days | **Target Score:** 80–85/100

---

## Part 1: Prerequisites — What You'll Install

Before writing a single line of code, you need these tools installed in order. Do **not** skip or reorder.

| Tool | Purpose | Where to Get |
|------|---------|--------------|
| WSL2 (Windows Subsystem for Linux) | Run Linux commands on Windows | Built into Windows 10/11 |
| Docker Desktop | Container runtime for Minikube | docker.com/products/docker-desktop |
| kubectl | Kubernetes CLI (talk to your cluster) | kubernetes.io/docs/tasks/tools/install-kubectl-windows |
| Minikube | Local Kubernetes cluster | minikube.sigs.k8s.io |
| Helm | Kubernetes package manager (for Prometheus) | helm.sh |
| Python 3.10+ | Backend runtime | python.org/downloads |
| Node.js 18+ | React frontend runtime | nodejs.org |
| Ollama | Local LLM runner (Phi-3) | ollama.ai |
| VS Code | Your IDE | code.visualstudio.com |
| Git | Version control | git-scm.com |

---

## Part 2: Installation — Step by Step

### Step 1: Enable WSL2 (Windows Subsystem for Linux)

WSL2 is required for Docker Desktop and makes running Linux commands much easier. Open **PowerShell as Administrator** and run:

```powershell
wsl --install
```

After it completes, **restart your computer**. After restart, WSL2 will finish setup and ask you to create a Linux username and password (choose anything simple).

To verify WSL2 is working:
```powershell
wsl --list --verbose
```
You should see `Ubuntu` with version `2`.

### Step 2: Install Docker Desktop

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
2. Run the installer — accept all defaults
3. During install, make sure **"Use WSL 2 instead of Hyper-V"** is checked
4. After install, open Docker Desktop and wait for it to show "Engine Running" (green icon)

Verify in PowerShell:
```powershell
docker --version
docker run hello-world
```
Expected output: `Hello from Docker!`

> ⚠️ **Important:** Docker Desktop must be running every time you work on this project. Start it first before anything else.

### Step 3: Install kubectl

Open PowerShell and run:
```powershell
# Download kubectl
curl.exe -LO "https://dl.k8s.io/release/v1.29.0/bin/windows/amd64/kubectl.exe"

# Move to a folder in PATH (create if needed)
mkdir C:\kubectl
move kubectl.exe C:\kubectl\kubectl.exe
```

Now add `C:\kubectl` to your PATH:
1. Press `Win + S` → Search "Environment Variables"
2. Click "Environment Variables..."
3. Under "System Variables", find `Path` → click Edit
4. Click "New" → type `C:\kubectl`
5. Click OK all the way out

Verify in a **new** PowerShell window:
```powershell
kubectl version --client
```

### Step 4: Install Minikube

```powershell
# Download Minikube
curl.exe -LO https://storage.googleapis.com/minikube/releases/latest/minikube-windows-amd64.exe

# Move to PATH folder
move minikube-windows-amd64.exe C:\kubectl\minikube.exe
```

Start Minikube (this will take 5–10 minutes first time):
```powershell
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=20g
```

Verify:
```powershell
kubectl get nodes
```
Expected: One node named `minikube` with status `Ready`.

> 💡 **Minikube Tip:** Every time you restart your PC, run `minikube start` before working. Run `minikube stop` when done for the day to free RAM.

### Step 5: Install Helm

```powershell
# Download and run Helm installer script in PowerShell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 -OutFile get-helm.ps1
# OR download the Windows installer from: https://helm.sh/docs/intro/install/
# Direct download: https://get.helm.sh/helm-v3.14.0-windows-amd64.zip
```

Easiest method — use Chocolatey (Windows package manager):
```powershell
# Install Chocolatey first (run in Admin PowerShell)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Helm
choco install kubernetes-helm -y
```

Verify:
```powershell
helm version
```

### Step 6: Install Python 3.10+

1. Go to https://www.python.org/downloads/
2. Download Python 3.11 (recommended)
3. Run installer — **CHECK "Add Python to PATH"** during install
4. Click "Install Now"

Verify:
```powershell
python --version
pip --version
```

### Step 7: Install Node.js 18+

1. Go to https://nodejs.org/
2. Download the **LTS version** (currently 20.x)
3. Run installer — accept all defaults

Verify:
```powershell
node --version
npm --version
```

### Step 8: Install Ollama

1. Go to https://ollama.ai
2. Click "Download for Windows"
3. Run the installer
4. Ollama runs as a background service automatically

Download the Phi-3 model (this is the LLM for your AI insights):
```powershell
ollama pull phi3:mini
```
This downloads ~2GB. Run it once and you're set.

Verify:
```powershell
ollama list
```
You should see `phi3:mini` in the list.

### Step 9: Install VS Code + Extensions

1. Download from https://code.visualstudio.com/
2. Install with defaults

Install these VS Code extensions (open VS Code → Extensions sidebar → search each):
- **Python** (by Microsoft)
- **Pylance**
- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **Kubernetes** (by Microsoft)
- **Docker** (by Microsoft)
- **YAML** (by Red Hat)
- **GitLens**

### Step 10: Install Git

1. Download from https://git-scm.com/download/win
2. Install — during setup, choose **"Git from the command line and also from 3rd-party software"**

```powershell
git --version
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## Part 3: Project Folder Structure

Open VS Code. Press `Ctrl+`` ` to open the terminal (PowerShell). Create your project:

```powershell
mkdir kubemind-ai
cd kubemind-ai
git init
```

Create this exact folder structure (copy-paste these commands):
```powershell
# Create all folders
mkdir backend, backend\agents, backend\llm, backend\metrics
mkdir frontend\src\components, frontend\src\styles
mkdir k8s, docker\student-portal, docker\face-recognition, docker\database
mkdir docs
```

Your structure should look like:
```
kubemind-ai/
├── backend/
│   ├── agents/
│   │   ├── cpu_agent.py
│   │   ├── memory_agent.py
│   │   ├── network_agent.py
│   │   └── dependency_agent.py
│   ├── llm/
│   │   └── insight_generator.py
│   ├── metrics/
│   │   └── prometheus_client.py
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MetricsPanel.jsx
│   │   │   ├── DependencyGraph.jsx
│   │   │   ├── InsightsPanel.jsx
│   │   │   └── AnomalyTimeline.jsx
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
├── k8s/
│   ├── student-portal.yaml
│   ├── face-recognition.yaml
│   └── database.yaml
├── docker/
│   ├── student-portal/
│   │   ├── Dockerfile
│   │   └── app.py
│   └── face-recognition/
│       ├── Dockerfile
│       └── app.py
├── docs/
│   ├── ARCHITECTURE.md
│   └── API_DOCS.md
├── docker-compose.yml
├── quickstart.sh
└── README.md
```

---

## Part 4: Deploy Infrastructure (Kubernetes + Prometheus)

Run these commands in PowerShell (Docker Desktop and Minikube must be running):

```powershell
# Start Minikube if not already running
minikube start --driver=docker --cpus=4 --memory=8192

# Create your project namespace
kubectl create namespace kubemind-demo

# Install Prometheus via Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/prometheus -n monitoring --create-namespace

# Verify Prometheus is running (wait ~2 minutes)
kubectl get pods -n monitoring
```

Wait until all Prometheus pods show `Running` status.

Test Prometheus is accessible:
```powershell
kubectl port-forward svc/prometheus-server 9090:80 -n monitoring
```
Open browser → http://localhost:9090 — you should see the Prometheus UI. Press `Ctrl+C` to stop.

---

## Part 5: Backend Code — What to Give Your Code Generator

Here is the **exact specification** to give to your code generation model. Copy-paste each section.

### 5.1 — File: `backend/requirements.txt`

Tell your model to create this file with exactly these dependencies:

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
aiohttp==3.9.0
prometheus-client==0.19.0
ollama==0.1.0
python-dotenv==1.0.0
pydantic==2.5.0
```

### 5.2 — File: `backend/metrics/prometheus_client.py`

**Prompt for code generator:**
> "Create a Python class `PrometheusClient` that:
> 1. Connects to Prometheus at `http://prometheus:9090` (configurable via env variable `PROMETHEUS_URL`)
> 2. Has an async method `fetch_metrics()` that queries these PromQL expressions:
>    - CPU: `rate(container_cpu_usage_seconds_total[1m]) * 100`
>    - Memory: `container_memory_usage_bytes / container_spec_memory_limit_bytes * 100`
>    - Restarts: `kube_pod_container_status_restarts_total`
>    - Network in: `rate(container_network_receive_bytes_total[1m])`
>    - Network out: `rate(container_network_transmit_bytes_total[1m])`
> 3. Stores results in `self.current_metrics` dict keyed by pod name
> 4. Has async method `query_prometheus(session, query)` using `aiohttp`
> 5. Use `async with aiohttp.ClientSession()` for all HTTP calls
> 6. Return `[]` (empty list) if Prometheus is unavailable, don't crash
> Also add mock data fallback: if Prometheus returns empty, populate with 3 fake pods (student-portal, face-recognition, database) with random-ish metric values so the dashboard always shows something"

### 5.3 — File: `backend/agents/cpu_agent.py`

**Prompt for code generator:**
> "Create a Python class `CPUAgent` that:
> 1. Takes a `prometheus_client` in `__init__`
> 2. Has `self.spike_threshold = 80` (flag if CPU > 80%)
> 3. Has `self.spike_cooldown = 5` (minutes between duplicate alerts)
> 4. Has `self.last_alert_time = {}` dict keyed by pod name
> 5. Has async method `detect()` that:
>    - Loops through `self.prometheus.current_metrics`
>    - If `cpu_percent > spike_threshold` AND cooldown expired: append anomaly dict to list
>    - Anomaly dict has keys: `type`, `pod`, `cpu_percent`, `threshold`, `severity` (high if >95, else medium), `message`
>    - Update `last_alert_time[pod_name]` when alert fires
> 6. Returns list of anomaly dicts"

### 5.4 — File: `backend/agents/memory_agent.py`

**Prompt for code generator:**
> "Create a Python class `MemoryAgent` that:
> 1. Takes `prometheus_client` in `__init__`
> 2. Tracks `self.memory_history = {}` dict of pod → list of {timestamp, memory}
> 3. `self.memory_threshold = 85` (alert if RAM > 85%)
> 4. `self.leak_detection_window = 5` minutes
> 5. `self.leak_growth_rate = 2.0` (% per minute threshold)
> 6. async `detect()` method:
>    - High memory check: if memory_percent > threshold, add anomaly
>    - Memory leak check: track history, if growth rate > leak_growth_rate, add anomaly with type='memory_leak'
>    - Prune history older than 10 minutes
> 7. Return list of anomalies"

### 5.5 — File: `backend/agents/network_agent.py`

**Prompt for code generator:**
> "Create NetworkAgent class:
> 1. Tracks `self.baseline_traffic = {}` per pod
> 2. `self.spike_multiplier = 3` (alert if traffic is 3x baseline)
> 3. `self.learning_samples = 5` (samples before baseline is established)
> 4. async `detect()`: compare current network in/out to learned baseline, flag 3x spikes
> 5. Return list of anomaly dicts with type='network_spike_inbound' or 'network_spike_outbound'"

### 5.6 — File: `backend/agents/dependency_agent.py`

**Prompt for code generator:**
> "Create DependencyAgent class:
> 1. Hardcoded dependency map (dict):
>    ```python
>    known_dependencies = {
>        'student-portal': ['face-recognition', 'database'],
>        'face-recognition': ['database'],
>        'chatbot': ['database'],
>        'notification': [],
>    }
>    ```
> 2. async `detect()`: check if any pod with dependents has >2 restarts, flag cascading failure
> 3. async `get_dependency_graph()`: return nodes and edges lists for visualization
>    - Each node: `{id, label, color}` where color=green if healthy, red if >0 restarts, orange if high CPU
>    - Each edge: `{source, target, type}`"

### 5.7 — File: `backend/llm/insight_generator.py`

**Prompt for code generator:**
> "Create InsightGenerator class using the `ollama` Python library:
> 1. `__init__(self, model_name='phi3:mini')`
> 2. async `generate(self, anomaly: dict, metrics: dict) -> str`:
>    - Build a prompt that includes the anomaly data as JSON and the relevant pod's current metrics
>    - Call `ollama.chat(model=self.model_name, messages=[{'role': 'user', 'content': prompt}])`
>    - Truncate response to max 2 sentences
>    - If ollama call fails (exception), fall back to template strings based on anomaly type
> 3. Template fallbacks for: cpu_spike, memory_leak, high_memory, network_spike_inbound, dependency_failure
> 4. Never raise an exception — always return a string"

### 5.8 — File: `backend/main.py`

**Prompt for code generator:**
> "Create FastAPI application with:
> 1. CORSMiddleware allowing http://localhost:3000
> 2. On startup: create background asyncio task that runs every 10 seconds:
>    - Call prometheus_client.fetch_metrics()
>    - Run all 4 agents (cpu, memory, network, dependency)
>    - For each anomaly, generate LLM insight
>    - Store in in-memory list `anomaly_history` (max 100 items)
> 3. REST endpoints:
>    - GET /health → {status: 'healthy', timestamp}
>    - GET /api/metrics/current → {metrics: current_metrics, pod_count, timestamp}
>    - GET /api/anomalies/current → last 20 anomalies from past 5 minutes
>    - GET /api/anomalies/history → grouped by minute for timeline chart
>    - GET /api/dependencies → nodes and edges from dependency agent
>    - GET /api/recommendations → list of optimization suggestions based on current metrics
>    - POST /api/simulate/cpu-spike?pod_name=face-recognition → manually trigger for demo
>    - POST /api/simulate/memory-leak?pod_name=chatbot → manually trigger for demo
> 4. WebSocket at /ws/metrics that sends metrics every 2 seconds
> 5. Run with uvicorn on port 8000"

---

## Part 6: Frontend Code — What to Give Your Code Generator

### 6.1 — Setup React App

In your PowerShell terminal:
```powershell
cd frontend
npx create-react-app . --template cra-template
```
(This creates the React project inside the `frontend/` folder)

Install frontend libraries:
```powershell
npm install recharts cytoscape react-cytoscapejs axios
```

### 6.2 — File: `frontend/src/App.jsx`

**Prompt for code generator:**
> "Rewrite App.jsx as the main KubeMind AI dashboard:
> 1. State: `metrics` (dict), `anomalies` (array), `dependencyGraph` (object), `loading` (bool)
> 2. useEffect: fetch `/api/metrics/current` every 5 seconds, store in `metrics`
> 3. useEffect: fetch `/api/anomalies/current` every 10 seconds, store in `anomalies`
> 4. useEffect: fetch `/api/dependencies` once on mount, store in `dependencyGraph`
> 5. Layout: Dark-themed dashboard with header 'KubeMind AI' + subtitle
> 6. Grid layout:
>    - Full-width row: `<MetricsPanel metrics={metrics} />`
>    - Full-width row: `<DependencyGraph graph={dependencyGraph} />`
>    - Two half-width columns: `<InsightsPanel anomalies={anomalies} />` and `<AnomalyTimeline />`
> 7. API_BASE = 'http://localhost:8000'
> 8. Show loading spinner while data loads"

### 6.3 — File: `frontend/src/components/MetricsPanel.jsx`

**Prompt for code generator:**
> "Create MetricsPanel component:
> 1. Props: `metrics` (object where key=pod name, value={cpu_percent, memory_percent, status, restarts})
> 2. Render a table showing all pods with columns: Pod Name, CPU%, Memory%, Status, Restarts
> 3. Color coding: CPU > 80 → red background, 60-80 → yellow/orange, <60 → green
> 4. Also render a BarChart (using recharts) below the table with CPU and Memory bars per pod
> 5. Auto-refreshes when metrics prop changes
> 6. Show 'Loading metrics...' if metrics is empty
> 7. Dark theme styling with CSS module or inline styles"

### 6.4 — File: `frontend/src/components/DependencyGraph.jsx`

**Prompt for code generator:**
> "Create DependencyGraph component using cytoscape.js:
> 1. Props: `graph` (object with `nodes` and `edges` arrays)
> 2. Use `cytoscape` library to render directed graph
> 3. Node colors: green (healthy), red (unhealthy/restarted), orange (high CPU)
> 4. Node size: 60x60, label below node
> 5. Edges: arrows showing direction of calls
> 6. Layout: 'breadthfirst' with directed: true
> 7. Container height: 300px
> 8. Show 'Loading dependency graph...' if graph prop is null"

### 6.5 — File: `frontend/src/components/InsightsPanel.jsx`

**Prompt for code generator:**
> "Create InsightsPanel component:
> 1. Props: `anomalies` (array of anomaly objects)
> 2. Show last 10 anomalies as cards
> 3. Each card shows: anomaly type (badge), pod name, AI insight text, timestamp, severity (color-coded)
> 4. Severity colors: critical=red, high=orange, medium=yellow
> 5. Left border color matches severity
> 6. If no anomalies: show green banner 'All systems healthy'
> 7. Cards are scrollable in a fixed-height container"

### 6.6 — File: `frontend/src/components/AnomalyTimeline.jsx`

**Prompt for code generator:**
> "Create AnomalyTimeline component:
> 1. Fetch `/api/anomalies/history` on mount and every 30 seconds
> 2. Render a BarChart (recharts) with:
>    - X-axis: time (HH:MM)
>    - Y-axis: anomaly count
>    - Bar: shows count of anomalies per time bucket
> 3. Clicking a bar shows details of anomalies in that time window (expandable section below chart)
> 4. Title: 'Anomaly Timeline (Last Hour)'
> 5. Show 'No anomaly data yet' if history is empty"

---

## Part 7: Docker Images — Microservices

### 7.1 — Student Portal Service

Create `docker/student-portal/app.py`:

**Prompt for code generator:**
> "Create a Flask app that simulates a university student portal:
> 1. GET /health → {status: healthy}
> 2. POST /process-attendance → simulate request to face-recognition service, record in memory
> 3. GET /metrics → expose custom metrics (requests_per_second, response_time_ms)
> 4. Has a configurable request rate (env var REQUEST_RATE, default 10/sec)
> 5. Background thread that continuously sends requests to face-recognition (FACE_RECOGNITION_URL env var)
> 6. POST /simulate?type=load_spike → increase request rate 5x for 60 seconds
> 7. Run on port 5000"

Create `docker/student-portal/Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
RUN pip install flask requests prometheus-client
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
```

### 7.2 — Face Recognition Service

Create `docker/face-recognition/app.py`:

**Prompt for code generator:**
> "Create a Flask app that simulates CPU-intensive face recognition:
> 1. GET /health → {status: healthy}
> 2. POST /process → simulate image processing: burn CPU for configurable duration, return result
> 3. Global variable `CPU_INTENSITY` controls how much CPU is burned (0=minimal, 1=full burn for 2 seconds)
> 4. POST /simulate → body: {type: 'cpu_spike'} → set CPU_INTENSITY=1 for 60 seconds then reset
> 5. GET /metrics → response_time stats
> 6. Run on port 5000, threaded=True so it handles concurrent requests"

Create `docker/face-recognition/Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
RUN pip install flask
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
```

---

## Part 8: Kubernetes YAML Manifests

Create these in the `k8s/` folder. Your code generator can create them with this prompt:

**Prompt for `k8s/student-portal.yaml`:**
> "Create a Kubernetes Deployment + Service YAML for student-portal:
> - Namespace: kubemind-demo
> - Replicas: 2
> - Image: kubemind/student-portal:latest
> - imagePullPolicy: Never (for local Minikube images)
> - Port: 5000
> - Resources: requests cpu=100m memory=128Mi, limits cpu=500m memory=512Mi
> - Env vars: FACE_RECOGNITION_URL=http://face-recognition:5000, DATABASE_URL=postgresql://postgres:password@database:5432/kubemind
> - LivenessProbe: GET /health port 5000, initialDelay=5s
> - Service: ClusterIP, port 5000"

Repeat with similar specs for `face-recognition.yaml` (1 replica, cpu limit=1000m) and `database.yaml` (use standard postgres:14 image, port 5432).

---

## Part 9: Build and Deploy Everything

### Step 1: Build Docker Images Inside Minikube

Minikube has its own Docker daemon. You need to build images inside it:

```powershell
# Point your shell to Minikube's Docker
minikube docker-env | Invoke-Expression

# Build student portal image
cd docker/student-portal
docker build -t kubemind/student-portal:latest .

# Build face recognition image
cd ../face-recognition
docker build -t kubemind/face-recognition:latest .

cd ../..
```

### Step 2: Deploy Services to Kubernetes

```powershell
kubectl apply -f k8s/student-portal.yaml -n kubemind-demo
kubectl apply -f k8s/face-recognition.yaml -n kubemind-demo
kubectl apply -f k8s/database.yaml -n kubemind-demo

# Check all pods are running (wait 1-2 minutes)
kubectl get pods -n kubemind-demo
```

All should show `Running`. If any show `Pending` or `CrashLoopBackOff`, debug with:
```powershell
kubectl describe pod <pod-name> -n kubemind-demo
kubectl logs <pod-name> -n kubemind-demo
```

### Step 3: Expose Services for Backend Access

```powershell
# Expose Prometheus to localhost
kubectl port-forward svc/prometheus-server 9090:80 -n monitoring

# In a separate terminal — expose student portal (for demo triggers)
kubectl port-forward svc/student-portal 5001:5000 -n kubemind-demo

# In a separate terminal — expose face recognition (for demo triggers)
kubectl port-forward svc/face-recognition 5002:5000 -n kubemind-demo
```

> 💡 Open 3 PowerShell terminals in VS Code: press `Ctrl+Shift+5` to split the terminal panel.

### Step 4: Start the Backend

```powershell
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs at http://localhost:8000. Test it:
```powershell
curl http://localhost:8000/health
curl http://localhost:8000/api/metrics/current
```

### Step 5: Start the Frontend

In another terminal:
```powershell
cd frontend
npm start
```

Browser opens automatically at http://localhost:3000 — your dashboard!

---

## Part 10: Demo Scenario Scripts

Practice these 3 scenarios before recording. They must work reliably.

### Demo 1: Normal Operation (show everything healthy)
Just open the dashboard and let it run. All pods green, no anomalies.

### Demo 2: CPU Spike Scenario
```powershell
# Trigger CPU spike on face-recognition pod
curl -X POST "http://localhost:8000/api/simulate/cpu-spike?pod_name=face-recognition"
```
Watch the dashboard: face-recognition turns orange/red in MetricsPanel, an anomaly card appears in InsightsPanel with AI insight, dependency graph highlights the affected node.

### Demo 3: Memory Leak Scenario
```powershell
# Trigger memory leak simulation
curl -X POST "http://localhost:8000/api/simulate/memory-leak?pod_name=chatbot"
```
Watch memory steadily increase over 2-3 minutes, memory_agent detects it, AI generates insight recommending restart.

---

## Part 11: Daily Work Plan (9 Days)

| Day | Date | Goal | Hours |
|-----|------|------|-------|
| **Day 1** | May 10 (Evening) | Install all tools, verify everything works, watch "Kubernetes in 100 Seconds" | 4h |
| **Day 2** | May 11 | Set up Minikube, deploy Prometheus, create project folder structure | 6h |
| **Day 3** | May 12 | Write/generate backend code (PrometheusClient + agents) | 6h |
| **Day 4** | May 13 | Write/generate LLM insight generator + FastAPI main.py | 5h |
| **Day 5** | May 14 | Build Docker images, deploy K8s manifests, test backend endpoints | 6h |
| **Day 6** | May 15 | Create React app, all 4 components, connect to backend | 6h |
| **Day 7** | May 16 | Integration testing, fix bugs, test all 3 demo scenarios | 5h |
| **Day 8** | May 17 | Polish UI, write GitHub README + docs, practice demo | 5h |
| **Day 9** | May 18–19 | Record video, edit, submit | 4h |

---

## Part 12: VS Code Workflow Tips

### Recommended Terminal Setup
Open VS Code in your project root: `code .` (from PowerShell inside `kubemind-ai/` folder)

Split terminal into 4 panes (`Ctrl+Shift+5`):
- **Pane 1:** `kubectl port-forward svc/prometheus-server 9090:80 -n monitoring`
- **Pane 2:** `cd backend && python main.py`
- **Pane 3:** `cd frontend && npm start`
- **Pane 4:** General commands (kubectl checks, curl tests, git)

### Useful kubectl Commands for Debugging
```powershell
# See all pods and their status
kubectl get pods -n kubemind-demo

# See pod logs (replace <pod-name> with actual name from above)
kubectl logs <pod-name> -n kubemind-demo

# Describe a pod (shows events, resource issues)
kubectl describe pod <pod-name> -n kubemind-demo

# Check Prometheus targets (are your pods being scraped?)
# (Open browser after port-forward) http://localhost:9090/targets

# Check resource usage (like Task Manager for K8s)
kubectl top pods -n kubemind-demo
```

### VS Code Workspace Settings
Create `.vscode/settings.json` in your project root:
```json
{
  "python.defaultInterpreterPath": "python",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "ms-python.python"
  },
  "files.exclude": {
    "**/__pycache__": true,
    "**/node_modules": true
  }
}
```

---

## Part 13: Common Windows-Specific Problems

| Problem | Cause | Fix |
|---------|-------|-----|
| `minikube start` fails with "docker not found" | Docker Desktop not running | Start Docker Desktop first, wait for "Running" status |
| `kubectl` not found | PATH not set correctly | Close and reopen PowerShell after adding to PATH |
| Port-forward disconnects | Idle timeout | Restart with same command; consider using a PowerShell script to auto-restart |
| Pods stuck in `Pending` | Not enough RAM allocated | Run `minikube delete` then `minikube start --memory=6000` (adjust to available RAM) |
| React can't reach backend | CORS not configured | Ensure `allow_origins=["http://localhost:3000"]` in FastAPI CORS config |
| Ollama not responding | Service not started | Open Ollama app from Start Menu, or run `ollama serve` in terminal |
| Docker image not found in K8s | Not built inside Minikube's Docker | Re-run `minikube docker-env | Invoke-Expression` then rebuild |
| Python module not found | Wrong Python env | Run `pip install -r requirements.txt` again from the backend folder |

---

## Part 14: GitHub Repository Setup

```powershell
# Initialize git (if not done)
cd kubemind-ai
git init

# Create .gitignore
echo "node_modules/" >> .gitignore
echo "__pycache__/" >> .gitignore
echo "*.pyc" >> .gitignore
echo ".env" >> .gitignore
echo "venv/" >> .gitignore

# First commit
git add .
git commit -m "Initial KubeMind AI project structure"

# Connect to GitHub (create repo on github.com first)
git remote add origin https://github.com/YOUR_USERNAME/kubemind-ai.git
git push -u origin main
```

**README.md must include:**
- Project description and problem statement
- Architecture diagram (text-based is fine)
- Setup instructions (point to SETUP.md)
- Tech stack
- Team members
- Demo video link (add after recording)
- Screenshots of the dashboard

---

## Part 15: Pre-Video Recording Checklist

Before hitting record, verify each item:

- [ ] Minikube running: `kubectl get nodes` shows `Ready`
- [ ] All 3 pods healthy: `kubectl get pods -n kubemind-demo` all `Running`
- [ ] Prometheus collecting data: http://localhost:9090/targets shows your pods
- [ ] Backend responding: `curl http://localhost:8000/api/metrics/current` returns data
- [ ] Dashboard loading: http://localhost:3000 shows metrics (not empty)
- [ ] LLM working: `curl -X POST http://localhost:8000/api/simulate/cpu-spike?pod_name=face-recognition` → insight appears in dashboard
- [ ] Dependency graph rendering: graph shows 3+ nodes with edges
- [ ] Demo Scenario 2 (CPU spike) tested: anomaly detected within 30 seconds
- [ ] Demo Scenario 3 (Memory leak) tested: anomaly detected within 2-3 minutes
- [ ] Video script timed: under 5 minutes
- [ ] Audio tested: clear and no background noise
- [ ] Screen resolution: 1920×1080, browser at 100% zoom
- [ ] Browser tabs closed: only the dashboard open during recording

---

## Part 16: Video Recording Setup

**Software:** OBS Studio (free) — download from https://obsproject.com/

**OBS Settings:**
- Output Resolution: 1920×1080
- FPS: 30
- Format: MP4
- Bitrate: 4000 Kbps

**What to show in the video:**
1. (0:00–0:30) Slide or screen with problem statement (narrate)
2. (0:30–1:00) Show architecture diagram (docs/ARCHITECTURE.md or draw.io)
3. (1:00–1:45) Dashboard overview — show live metrics, dependency graph
4. (1:45–3:00) Live demo — trigger CPU spike, show anomaly + AI insight in real time
5. (3:00–3:30) Show memory scenario
6. (3:30–4:00) Show GitHub repo + brief code walkthrough
7. (4:00–5:00) Team intro, impact statement, closing

**Editing:** DaVinci Resolve (free) — add text overlays for key moments, background music (search "royalty free background music" on YouTube Audio Library).

---

*Good luck! Follow this guide day by day, use the mentor's guide documents for architecture decisions, and the technical implementation guide for detailed code templates. You've got this.*
