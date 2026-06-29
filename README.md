# Sentinel: Blockchain Security Audit and Threat Mitigation Framework

Sentinel is an end-to-end security auditing, vulnerability verification, and threat mitigation solution for Ethereum smart contracts, blockchain node infrastructures, cross-chain bridges, transaction compliance, and incident response. 

The framework is paired with a premium, high-fidelity **interactive dashboard** inspired by industry-leading vault management interfaces (Fireblocks). It provides real-time event feeds, automated exploit simulations, on-chain telemetry watchers, and audit-ready report generation.

---

## 🖥️ Interactive Dashboard (SENTINEL Command Center)

The framework includes a fully graphical dashboard to monitor network configurations, inspect contract code, run verification suites, and trigger incident response playbooks.

### Dashboard Key Features:
* **Target Accounts Overview:** Real-time visibility into Cross-Chain Bridges, Compliance Scan states, and Vault highlight health scores.
* **Vulnerability Sandbox:** Code split-viewer mapping vulnerable smart contracts directly to their secure, mitigated versions, complete with simulated exploit runners and unit test validators.
* **Transaction Compliance (Chainalysis):** Address lookup engine with deterministic risk gauges and full transaction database scans.
* **Infrastructure Telemetry:** Probes local network nodes for open RPC port exposure and exposed debug/admin namespaces.
* **Emergency Circuit Breakers:** Allows administrators to toggle immediate pause states on active contracts in response to live threats.
* **Audit-Ready Exports:** Markdown and layout-optimized PDF generation for formal security reviews.
* **Active Telemetry Sidebar:** Slide-open live transaction feed mapping blocks and intercepted contract warnings into clean flow cards.

### How to Run the Dashboard:

To launch the backend Node.js web server and open the command center:

```bash
# Start the local server
npm run dashboard
```

Once started, open your web browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📂 Project Structure

```
blockchain-security-audit/
├── Audits/                 # Security audit reports and findings
│   └── smart-contracts/    # Markdown audit reports
├── dashboard/              # Web application files
│   ├── server.js           # API routers and static files server
│   └── public/             # CSS styling, layouts, and JS controllers
├── docs/                   # Best practices and security case studies
├── src/                    # Smart contracts and interoperability components
│   ├── interoperability/   # Cross-chain bridge contracts
│   ├── secure-smart-contracts/ # Secure implementations of common patterns
│   └── vulnerable-smart-contracts/ # Exploitable implementations of vulnerabilities
├── test/                   # Mocha/Chai test suite verifying exploits and mitigations
├── tools/                  # Script configurations and external integrations
│   └── chainalysis/        # Compliance check scripts and transaction logs
├── monitoring/             # Live network and RPC endpoint auditing tools
├── scripts/                # Deployment and automated pipeline runners
├── package.json            # Node.js dependencies and run scripts
├── requirements.txt        # Python dependency specifications
├── Cargo.toml              # Rust environment configuration
└── hardhat.config.js       # Hardhat workspace configuration
```

---

## ⚙️ Setup and Installation

### Prerequisites

* **Node.js** and **npm** (for contract compilation, testing, and running the dashboard)
* **Python 3.10+** (for compliance script scanning and static analysis)

### Installing Dependencies

Install the required npm packages and Python dependencies from the repository root:

```bash
# Install Node dependencies (including Hardhat and OpenZeppelin library)
npm install

# Install Python requirements
# Note: On Windows, use "py -m pip" if python is not mapped to path aliases
py -m pip install -r requirements.txt
```

---

## 🧪 Security Verification (CLI Mode)

We utilize a comprehensive Mocha/Chai unit test suite to simulate attack vectors and verify the correctness of their mitigations.

### Compile Smart Contracts

```bash
npm run compile
```

### Run Tests and Exploit Simulations

```bash
npm run test
```

The test suite runs the following verifications:
* **Reentrancy:** Verifies that an attacker can successfully drain a vulnerable contract, and that `ReentrancyGuard` stops the exploit in the secure contract.
* **Integer Overflow:** Verifies wrap-around behavior in unchecked arithmetic flows, and validates reversion checks in the secure implementation.
* **Flash Loan Repayment:** Verifies pool draining on missing repayment checks, and validates rejection logic in the secure implementation.
* **Cross-Chain Bridge:** Verifies message spoofing when message processing lacks validation, and confirms validator access gates block unauthorized attempts.

---

## 🛡️ Telemetry & Compliance CLI Scripts

### Compliance Scan (Chainalysis Integration)

To scan the transactions database file using python (runs in offline mock mode if no API key is set in the environment variables):

```bash
# Windows Launcher:
py tools/chainalysis/compliance.py

# POSIX Launcher:
python3 tools/chainalysis/compliance.py
```

### Blockchain Node Infrastructure Check

To check open RPC ports for exposure of sensitive admin or debug interfaces:

```bash
bash monitoring/nodeSecurityMonitor.sh
```

---

## 🚨 Incident Response Playbook

The table below outlines playbooks for common security incidents and recommended mitigation strategies:

| Threat Event | Immediate Response Action | Prevention Strategy |
|:---|:---|:---|
| **Reentrancy Attack** | Pause target contract, isolate affected functions. | Implement `ReentrancyGuard`, ensure Check-Effects-Interactions. |
| **Flash Loan Exploit** | Halt pool withdrawals, reset oracle data feeds. | Require loan repayment verification inside the same transaction block. |
| **Cross-Chain Replay** | Revoke affected validators, pause bridge contract. | Require signature nonces and validator authorization checks. |
| **RPC Endpoint Breach** | Stop node execution, rotate API keys, block ports. | Restrict public RPC endpoint access via firewall (iptables). |
| **Admin Key Compromise** | Rotate multisig owners, revoke previous authorizations. | Require multi-signature confirmations (e.g., Gnosis Safe). |

---

## 🚀 Deploying to Render (Cloud Hosting)

The framework contains a predefined `render.yaml` Blueprint file to automate cloud setup:

1. Push this repository to **GitHub**.
2. Log in to the **[Render Dashboard](https://dashboard.render.com/)**.
3. Click **New** > **Blueprint**.
4. Select and connect your repository.
5. Render will automatically parse the `render.yaml` configuration and launch:
   * **Service Name:** `sentinel-security-dashboard`
   * **Environment Runtime:** Node.js
   * **Build Command:** `npm run build` (compiles Solidity contracts via Hardhat and installs Python requirements)
   * **Start Command:** `npm run dashboard` (binds dynamically to Render's port env)
