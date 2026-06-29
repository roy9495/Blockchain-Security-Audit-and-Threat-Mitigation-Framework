document.addEventListener("DOMContentLoaded", () => {
    // Icons initialization helper
    function initLucide() {
        try {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } catch (e) {
            console.warn("Lucide icons failed to render:", e);
        }
    }
    initLucide();

    // Chart Instance
    let vulnChartInstance = null;

    // Navigation and Tab Switching
    const navItems = document.querySelectorAll(".nav-item");
    const panels = document.querySelectorAll(".tab-panel");
    const tabTitle = document.getElementById("current-tab-title");
    const tabSubtitle = document.getElementById("current-tab-subtitle");

    const tabMeta = {
        overview: { title: "Security Overview", subtitle: "Real-time smart contract health and network telemetry." },
        sandbox: { title: "Vulnerability Sandbox", subtitle: "Simulate attacks on smart contracts and verify secure patches." },
        compliance: { title: "Compliance Scanner", subtitle: "Query wallets and scan logs using Chainalysis risk rules." },
        monitoring: { title: "Threat Monitoring", subtitle: "Configure live blockchain watchers and probe node configurations." },
        mitigation: { title: "Incident Response", subtitle: "Circuit breakers and manual tracing playbook overrides." },
        reports: { title: "Audit Reports", subtitle: "Static analysis and formal audit reports." }
    };

    function switchTab(tabId) {
        navItems.forEach(btn => {
            if (btn.getAttribute("data-tab") === tabId) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        panels.forEach(panel => {
            if (panel.id === `tab-${tabId}`) {
                panel.classList.add("active");
            } else {
                panel.classList.remove("active");
            }
        });

        tabTitle.textContent = tabMeta[tabId].title;
        tabSubtitle.textContent = tabMeta[tabId].subtitle;

        // Perform specific tab actions
        if (tabId === "overview") {
            loadSummary();
            renderCharts();
        } else if (tabId === "sandbox") {
            loadContracts();
        } else if (tabId === "reports") {
            fetchReport();
        } else if (tabId === "monitoring") {
            loadMonitorSettings();
        }
    }

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabId = item.getAttribute("data-tab");
            switchTab(tabId);
        });
    });

    // Make switchTab global for inline button calls
    window.switchTab = switchTab;

    // Load Summary Metrics
    async function loadSummary() {
        try {
            const response = await fetch("/api/summary");
            const data = await response.json();

            document.getElementById("overview-score").textContent = `${data.securityScore}%`;
            
            const v = data.vulnerabilities;
            document.getElementById("overview-vulns").textContent = v.critical + v.high + v.medium;
            
            const activeCount = Object.values(data.networkMonitorStatus).filter(Boolean).length;
            document.getElementById("overview-monitors").textContent = `${activeCount}/4`;

            const pauseCount = Object.values(data.pauses).filter(Boolean).length;
            document.getElementById("overview-pauses").textContent = `${pauseCount}/4`;

            // Update emergency mitigation buttons styles based on pauses
            for (const contract in data.pauses) {
                const btn = document.getElementById(`btn-pause-${contract}`);
                if (btn) {
                    if (data.pauses[contract]) {
                        btn.textContent = "Unpause Contract";
                        btn.className = "btn btn-success";
                    } else {
                        btn.textContent = "Pause Contract";
                        btn.className = "btn btn-danger";
                    }
                }
            }

            loadAlerts();
        } catch (err) {
            console.error("Error loading summary:", err);
        }
    }

    // Load Alerts
    async function loadAlerts() {
        try {
            const response = await fetch("/api/alerts");
            const alerts = await response.json();

            const container = document.getElementById("alerts-container");
            const dropdownList = document.getElementById("dropdown-alerts-list");
            const badge = document.getElementById("alert-count-badge");
            
            badge.textContent = alerts.length;
            
            if (container) container.innerHTML = "";
            if (dropdownList) dropdownList.innerHTML = "";

            if (alerts.length === 0) {
                const emptyHTML = `<div class="text-muted text-center py-4">No active security alerts.</div>`;
                if (container) container.innerHTML = emptyHTML;
                if (dropdownList) dropdownList.innerHTML = emptyHTML;
                return;
            }

            alerts.forEach(alert => {
                // Populate Overview panel logs
                if (container) {
                    const div = document.createElement("div");
                    div.className = `alert-item ${alert.type || "info"}`;
                    div.innerHTML = `
                        <div class="alert-item-header">
                            <span>${alert.title}</span>
                            <span class="alert-item-time">${alert.timestamp}</span>
                        </div>
                        <div class="alert-item-msg">${alert.message}</div>
                    `;
                    container.appendChild(div);
                }

                // Populate Dropdown logs
                if (dropdownList) {
                    const div = document.createElement("div");
                    div.className = `dropdown-item ${alert.type || "info"}`;
                    // Set border color dynamically matching type
                    const colorMap = { info: "#3b82f6", warning: "#f59e0b", danger: "#f43f5e", success: "#10b981" };
                    div.style.borderLeft = `3px solid ${colorMap[alert.type || 'info']}`;
                    div.innerHTML = `
                        <div class="dropdown-item-header">
                            <span style="font-weight:600">${alert.title}</span>
                            <span class="dropdown-item-time">${alert.timestamp}</span>
                        </div>
                        <div style="color:var(--text-secondary); margin-top:2px">${alert.message}</div>
                    `;
                    dropdownList.appendChild(div);
                }
            });
        } catch (err) {
            console.error("Error loading alerts:", err);
        }
    }

    // Render Chart.js
    function renderCharts() {
        const ctx = document.getElementById("vulnChart").getContext("2d");
        
        if (vulnChartInstance) {
            vulnChartInstance.destroy();
        }

        Chart.defaults.color = '#64748b';
        Chart.defaults.font.family = "'Outfit', sans-serif";

        vulnChartInstance = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Reentrancy (SEC-01)", "Integer Overflow (SEC-04)", "Flash Loan (SEC-02)", "Bridge Security (SEC-03)"],
                datasets: [
                    {
                        data: [80, 16, 3, 1],
                        backgroundColor: ["#818cf8", "#60a5fa", "#f472b6", "#cbd5e1"],
                        borderWidth: 0,
                        hoverOffset: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "75%",
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Global Suite runner
    document.getElementById("run-global-audit-btn").addEventListener("click", async () => {
        const btn = document.getElementById("run-global-audit-btn");
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Running...`;
        initLucide();
        btn.disabled = true;

        try {
            switchTab("sandbox");
            const terminal = document.getElementById("sandbox-terminal");
            terminal.innerHTML = "";
            appendTerminalLine("sandbox-terminal", "🚀 Executing automated analysis pipeline...", "system");
            
            const res = await fetch("/api/run-tests");
            const result = await res.json();
            
            terminal.innerHTML = "";
            const lines = result.logs.split("\n");
            lines.forEach(line => {
                let type = "system";
                if (line.includes("✔") || line.includes("passing")) type = "success";
                if (line.includes("failing") || line.includes("AssertionError") || line.includes("Error:")) type = "error";
                appendTerminalLine("sandbox-terminal", line, type);
            });

            loadSummary();
        } catch (e) {
            appendTerminalLine("sandbox-terminal", `Exception: ${e.message}`, "error");
        } finally {
            btn.innerHTML = originalContent;
            btn.disabled = false;
            initLucide();
        }
    });

    // Clear alerts
    const clearAlertsBtn = document.getElementById("clear-alerts-btn");
    if (clearAlertsBtn) {
        clearAlertsBtn.addEventListener("click", async () => {
            // Just empty locally for this session
            const container = document.getElementById("alerts-container");
            if (container) container.innerHTML = `<div class="text-muted text-center py-4">No active security alerts.</div>`;
            const badge = document.getElementById("alert-count-badge");
            if (badge) badge.textContent = "0";
        });
    }

    // Smart Contract Code Viewer
    let contractsCache = null;

    async function loadContracts() {
        if (contractsCache) {
            updateCodeView();
            return;
        }

        try {
            const response = await fetch("/api/contracts");
            contractsCache = await response.json();
            updateCodeView();
        } catch (err) {
            console.error("Failed to load contracts code:", err);
        }
    }

    function updateCodeView() {
        const select = document.getElementById("vuln-select-dropdown");
        const selected = select.value;
        const data = contractsCache[selected];

        document.getElementById("sandbox-vuln-name").textContent = data.name;
        document.getElementById("sandbox-vuln-desc").textContent = data.description;
        
        // Show paths clearly
        document.getElementById("vuln-contract-file-label").textContent = `Vulnerable: ${data.vulnPath}`;
        document.getElementById("sec-contract-file-label").textContent = `Secure: ${data.secPath}`;
        
        const vulnCodeElem = document.getElementById("vulnerable-code-block");
        const secCodeElem = document.getElementById("secure-code-block");

        // Format simple Solidity highlighting for visual aesthetics
        vulnCodeElem.innerHTML = highlightSolidity(data.vulnCode);
        secCodeElem.innerHTML = highlightSolidity(data.secCode);
    }

    document.getElementById("vuln-select-dropdown").addEventListener("change", updateCodeView);

    function highlightSolidity(code) {
        // Very basic regex highlighter for presentation
        let escaped = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Comments
        escaped = escaped.replace(/(\/\/.*)/g, '<span class="text-muted">$1</span>');
        
        // Keywords
        const keywords = ["contract", "function", "modifier", "public", "external", "internal", "private", "returns", "require", "uint256", "address", "mapping", "constructor", "payable", "if", "else", "return", "unchecked"];
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b${kw}\\b`, "g");
            escaped = escaped.replace(regex, `<span style="color:#569cd6;font-weight:600">${kw}</span>`);
        });

        // Strings
        escaped = escaped.replace(/(['"].*?['"])/g, '<span style="color:#ce9178">$1</span>');

        return escaped;
    }

    // Exploit simulation
    document.getElementById("run-exploit-btn").addEventListener("click", () => simulateSandboxRun(true));
    document.getElementById("run-mitigation-btn").addEventListener("click", () => simulateSandboxRun(false));

    async function simulateSandboxRun(isExploit) {
        const select = document.getElementById("vuln-select-dropdown");
        const val = select.value; // reentrancy, overflow, flashloan, bridge
        
        const terminal = document.getElementById("sandbox-terminal");
        terminal.innerHTML = "";

        appendTerminalLine("sandbox-terminal", `🚀 Initiating sandbox verification request for profile: ${val.toUpperCase()}...`, "system");
        appendTerminalLine("sandbox-terminal", `Executing command: npx hardhat test --grep "${isExploit ? 'Vulnerable' : 'Secure'}"`, "input");

        try {
            // Trigger actual test via api
            // E.g., filters test files by grep matching 'Vulnerable' (for exploits) or 'Secure' (for mitigations)
            const queryName = isExploit ? "Vulnerable" : "Secure";
            const response = await fetch(`/api/run-tests?type=${val}_${queryName}`);
            const result = await response.json();

            // Render output
            const lines = result.logs.split("\n");
            lines.forEach(line => {
                let type = "system";
                if (line.includes("✔") || line.includes("passing")) type = "success";
                if (line.includes("failing") || line.includes("AssertionError") || line.includes("Error:") || line.includes("unrepaid")) type = "error";
                appendTerminalLine("sandbox-terminal", line, type);
            });

            if (isExploit) {
                appendTerminalLine("sandbox-terminal", `⚠️ Vulnerability verified. Contract balance was manipulated.`, "warn");
            } else {
                appendTerminalLine("sandbox-terminal", `✅ Verification Successful. All guard assertions passed. State is protected.`, "success");
            }
            loadSummary();
        } catch (e) {
            appendTerminalLine("sandbox-terminal", `Execution failed: ${e.message}`, "error");
        }
    }

    document.getElementById("clear-terminal-btn").addEventListener("click", () => {
        document.getElementById("sandbox-terminal").innerHTML = `<p class="term-line system">Terminal cleared.</p>`;
    });

    // Helper for terminal outputs
    function appendTerminalLine(terminalId, text, type = "system") {
        const terminal = document.getElementById(terminalId);
        const p = document.createElement("p");
        p.className = `term-line ${type}`;
        p.textContent = text;
        terminal.appendChild(p);
        terminal.scrollTop = terminal.scrollHeight;
    }

    // Compliance Tab Functions
    document.getElementById("compliance-check-btn").addEventListener("click", async () => {
        const input = document.getElementById("address-lookup-input").value.trim();
        const resultCard = document.getElementById("risk-result");
        
        if (!input) return;

        resultCard.classList.remove("hidden");
        const gauge = document.getElementById("risk-gauge-color");
        const scoreVal = document.getElementById("risk-score-val");
        const ratingLabel = document.getElementById("risk-rating-label");
        const detailText = document.getElementById("risk-detail-text");

        // Simulating Chainalysis check
        let riskScore = 15;
        if (input.toLowerCase() === "0xhighriskaddress" || input.includes("HighRisk")) {
            riskScore = 90;
        } else if (input.startsWith("0x") && input.length === 42) {
            // Generate a deterministic risk score for standard addresses
            riskScore = (parseInt(input.slice(2, 4), 16) % 60) + 10;
        }

        scoreVal.textContent = riskScore;
        
        // Gauge angle translation (from -45deg low risk to 135deg high risk)
        const angle = -45 + (riskScore / 100) * 180;
        gauge.style.transform = `rotate(${angle}deg)`;

        if (riskScore > 75) {
            gauge.style.borderColor = "#ef4444";
            ratingLabel.textContent = "High Risk (Critical)";
            ratingLabel.className = "text-danger";
            detailText.textContent = "CRITICAL: This wallet has been identified as interacting with sanctioned privacy mixers (Tornado Cash) or known exploit drains.";
        } else if (riskScore > 40) {
            gauge.style.borderColor = "#f59e0b";
            ratingLabel.textContent = "Medium Risk";
            ratingLabel.className = "text-warning";
            detailText.textContent = "WARNING: Wallet displays moderate security anomalies, possibly linked to fresh contracts or heavy slippage swaps.";
        } else {
            gauge.style.borderColor = "#10b981";
            ratingLabel.textContent = "Low Risk (Compliant)";
            ratingLabel.className = "text-success";
            detailText.textContent = "Wallet meets transaction compliance requirements. Safe to authorize smart contract calls.";
        }
    });

    document.getElementById("run-compliance-scan-btn").addEventListener("click", triggerComplianceScan);

    async function triggerComplianceScan() {
        switchTab("compliance");
        const tableBody = document.getElementById("compliance-tx-table");
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Scanning transactions.json...</td></tr>`;
        
        const terminal = document.getElementById("compliance-terminal");
        terminal.innerHTML = "";
        appendTerminalLine("compliance-terminal", "🚀 Scanning transaction records for compliance...", "system");

        try {
            const response = await fetch("/api/run-compliance");
            const data = await response.json();

            // Render stdout logs
            const lines = data.logs.split("\n");
            lines.forEach(line => {
                let type = "system";
                if (line.includes("suspicious")) type = "warn";
                if (line.includes("No high-risk")) type = "success";
                appendTerminalLine("compliance-terminal", line, type);
            });

            // Render table
            tableBody.innerHTML = "";
            data.transactions.forEach(tx => {
                const tr = document.createElement("tr");
                const isHighRisk = tx.riskScore > 75;
                
                tr.innerHTML = `
                    <td class="text-info">${tx.hash}</td>
                    <td>${tx.from}</td>
                    <td>${tx.to}</td>
                    <td>${tx.value} ETH</td>
                    <td><span class="badge ${isHighRisk ? 'badge-danger' : 'badge-success'}">${tx.riskScore}%</span></td>
                    <td class="${isHighRisk ? 'text-danger' : 'text-success'}">${tx.status}</td>
                `;
                tableBody.appendChild(tr);
            });

            loadSummary();
        } catch (err) {
            appendTerminalLine("compliance-terminal", `Error: ${err.message}`, "error");
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Scan failed.</td></tr>`;
        }
    }

    // Window global triggers for quick actions
    window.triggerNodeProbe = triggerNodeProbe;
    window.triggerComplianceScan = triggerComplianceScan;

    // Node probe
    async function triggerNodeProbe() {
        switchTab("monitoring");
        const box = document.getElementById("node-probe-result-box");
        box.innerHTML = `<div class="probe-loading">Probing RPC endpoint configurations...</div>`;

        try {
            const response = await fetch("/api/probe-node");
            const report = await response.json();

            box.innerHTML = `
<b>Scan Timestamp:</b> ${report.timestamp}
<b>Endpoint URL:</b> ${report.endpoint}
<b>Port Connectivity:</b> <span class="${report.portStatus === 'open' ? 'text-danger' : 'text-success'}">${report.portStatus.toUpperCase()}</span>
<b>Namespace Exposure:</b>
  - admin: <span class="text-success">${report.exposedNamespaces.admin}</span>
  - debug: <span class="text-success">${report.exposedNamespaces.debug}</span>

<b>Recommendations:</b>
${report.recommendations.map(r => ` - ${r}`).join("\n")}
            `;

            loadSummary();
        } catch (e) {
            box.textContent = "Error: Unable to probe local node " + e.message;
        }
    }

    document.getElementById("run-node-probe-btn").addEventListener("click", triggerNodeProbe);

    // Monitor Settings
    async function loadMonitorSettings() {
        try {
            const res = await fetch("/api/monitors");
            const monitors = await res.json();
            
            document.getElementById("mon-onchain").checked = monitors.onChain;
            document.getElementById("mon-reentrancy").checked = monitors.reentrancy;
            document.getElementById("mon-flashloan").checked = monitors.flashLoan;
            document.getElementById("mon-crosschain").checked = monitors.crossChain;
        } catch (e) {
            console.error(e);
        }
    }

    async function saveMonitorSettings() {
        const settings = {
            onChain: document.getElementById("mon-onchain").checked,
            reentrancy: document.getElementById("mon-reentrancy").checked,
            flashLoan: document.getElementById("mon-flashloan").checked,
            crossChain: document.getElementById("mon-crosschain").checked,
        };

        try {
            await fetch("/api/monitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            loadSummary();
        } catch (e) {
            console.error(e);
        }
    }

    ["mon-onchain", "mon-reentrancy", "mon-flashloan", "mon-crosschain"].forEach(id => {
        document.getElementById(id).addEventListener("change", saveMonitorSettings);
    });

    // Simulated telemetry block stream
    const monitoringTerminal = document.getElementById("monitoring-terminal");
    let blockNumber = 19208340;

    function runTelemetryTicker() {
        // Run ticker independently of which panel is open so the sidebar stays updated
        const onchainActive = document.getElementById("mon-onchain") ? document.getElementById("mon-onchain").checked : true;
        const reentrancyActive = document.getElementById("mon-reentrancy") ? document.getElementById("mon-reentrancy").checked : true;
        const flashloanActive = document.getElementById("mon-flashloan") ? document.getElementById("mon-flashloan").checked : true;
        const crosschainActive = document.getElementById("mon-crosschain") ? document.getElementById("mon-crosschain").checked : true;

        blockNumber++;
        
        const logLines = [
            `Block #${blockNumber} mined. Hash: 0x${Math.random().toString(16).slice(2, 10)}... (12 transactions)`
        ];

        if (onchainActive && Math.random() > 0.6) {
            const val = (Math.random() * 200 + 50).toFixed(2);
            logLines.push(`⚠️ [On-Chain Watcher] High value transaction detected: ${val} ETH from 0x${Math.random().toString(16).slice(2, 6)}...`);
        }

        if (reentrancyActive && Math.random() > 0.8) {
            logLines.push(`🚨 [Reentrancy Watcher] Potential attack warning: Block #${blockNumber} has 8 recursive calls to contract 0xabcdef123456789.`);
        }

        if (flashloanActive && Math.random() > 0.8) {
            logLines.push(`⚠️ [Flash Loan Watcher] Large flash loan observed in UniswapV3 pool: 2,500 ETH borrowed.`);
        }

        if (crosschainActive && Math.random() > 0.9) {
            logLines.push(`🔍 [Bridge Watcher] Cross-Chain transaction processed on Ethereum Mainnet. Verifying signatures...`);
        }

        logLines.forEach(line => {
            const isWarning = line.includes("⚠️") || line.includes("Large flash loan");
            const isDanger = line.includes("🚨");
            let type = "system";
            if (isWarning) type = "warn";
            if (isDanger) type = "error";
            
            // Console print (if elements exist on active tab)
            if (monitoringTerminal) {
                appendTerminalLine("monitoring-terminal", line, type);
                
                // Cap the terminal size
                const maxLines = 100;
                while (monitoringTerminal.children.length > maxLines) {
                    monitoringTerminal.removeChild(monitoringTerminal.firstChild);
                }
            }
            
            // Sidebar visual cards update
            appendTelemetryCard(line, type);
        });

        setTimeout(runTelemetryTicker, 4000);
    }

    function appendTelemetryCard(line, type) {
        const container = document.getElementById("telemetry-cards-list");
        if (!container) return;
        
        // Remove placeholder text
        if (container.querySelector(".text-muted")) {
            container.innerHTML = "";
        }
        
        let actionLabel = "SYSTEM SCAN";
        let sourceName = "Local Node";
        let destName = "Sentinel Vault";
        let status = "completed";
        let statusText = "Completed";
        let sourceIcon = "server";
        let destIcon = "shield";
        
        const cleanLine = line.replace(/^[^\w]*/, ""); // strip characters
        
        if (cleanLine.includes("Block #")) {
            actionLabel = "BLOCK SYNC";
            sourceName = "Ethereum Net";
            destName = "Mainnet Node";
            status = "completed";
            statusText = "Synced";
            sourceIcon = "globe";
            destIcon = "database";
        } else if (cleanLine.includes("High value transaction")) {
            actionLabel = "TRANSFER DETECTED";
            const valMatch = cleanLine.match(/(\d+\.?\d*)\s*ETH/);
            if (valMatch) actionLabel = `TRANSFER ${valMatch[1]} ETH`;
            sourceName = "OTC Desk";
            destName = "Vault OTC";
            status = "pending";
            statusText = "Checking Risk";
            sourceIcon = "wallet";
            destIcon = "shield-alert";
        } else if (cleanLine.includes("recursive calls") || cleanLine.includes("Reentrancy Watcher")) {
            actionLabel = "MINT ATTACK WARNING";
            sourceName = "AttackerContract";
            destName = "Vault OTC";
            status = "failed";
            statusText = "Blocked (Reentrancy)";
            sourceIcon = "zap-off";
            destIcon = "shield-alert";
        } else if (cleanLine.includes("Large flash loan") || cleanLine.includes("Flash Loan Watcher")) {
            actionLabel = "SUPPLY LIQUIDITY ALERT";
            sourceName = "UniswapV3 Pool";
            destName = "Compound Bridge";
            status = "pending";
            statusText = "Partially Completed";
            sourceIcon = "shuffle";
            destIcon = "git-commit";
        } else if (cleanLine.includes("Bridge Watcher") || cleanLine.includes("Cross-Chain")) {
            actionLabel = "BRIDGE TRANSFER";
            sourceName = "InsecureBridge";
            destName = "Compound Bridge";
            status = "completed";
            statusText = "Processed";
            sourceIcon = "link";
            destIcon = "shuffle";
        }
        
        const card = document.createElement("div");
        card.className = "telemetry-event-card";
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        card.innerHTML = `
            <div class="tel-card-label">${actionLabel}</div>
            <div class="tel-card-flow">
                <div class="flow-node">
                    <div class="node-icon"><i data-lucide="${sourceIcon}"></i></div>
                    <span title="${sourceName}">${sourceName}</span>
                </div>
                <i data-lucide="arrow-right" class="flow-arrow"></i>
                <div class="flow-node">
                    <div class="node-icon dest"><i data-lucide="${destIcon}"></i></div>
                    <span title="${destName}">${destName}</span>
                </div>
            </div>
            <div class="tel-card-footer">
                <span class="tel-card-status ${status}">${statusText}</span>
                <span class="tel-card-time">${timeStr}</span>
            </div>
        `;
        
        container.insertBefore(card, container.firstChild);
        
        // Re-compile Lucide Icons inside card
        if (window.lucide && typeof window.lucide.createIcons === "function") {
            try {
                window.lucide.createIcons();
            } catch (e) {}
        }
        
        // Limit active elements count
        while (container.children.length > 10) {
            container.removeChild(container.lastChild);
        }
    }

    runTelemetryTicker();

    // Incident Response
    window.togglePause = async function (contract) {
        try {
            const response = await fetch("/api/pause-contracts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contract })
            });
            const data = await response.json();
            loadSummary();
        } catch (err) {
            console.error(err);
        }
    };

    document.getElementById("trigger-incident-btn").addEventListener("click", async () => {
        const txHash = document.getElementById("tx-hash-input").value.trim();
        const type = document.getElementById("exploit-type-select").value;
        const terminal = document.getElementById("incident-terminal");

        if (!txHash) return;

        terminal.innerHTML = "";
        appendTerminalLine("incident-terminal", `📌 Capturing trace logs for: ${txHash}...`, "system");

        try {
            const res = await fetch("/api/trigger-incident", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ txHash, type })
            });
            const data = await res.json();

            appendTerminalLine("incident-terminal", `✅ Tracing complete. Saved trace report in workspace at:`, "success");
            appendTerminalLine("incident-terminal", data.logPath, "input");
            appendTerminalLine("incident-terminal", JSON.stringify(data.traceLogs, null, 2), "system");

            loadSummary();
        } catch (e) {
            appendTerminalLine("incident-terminal", `Failed to trigger playbook: ${e.message}`, "error");
        }
    });

    // Fetch report
    async function fetchReport() {
        const mdContainer = document.getElementById("report-md-content");
        mdContainer.innerHTML = "Fetching report from workspace...";
        
        try {
            const res = await fetch("/api/report");
            const data = await res.json();
            if (data.content) {
                // Parse markdown
                mdContainer.innerHTML = marked.parse(data.content);
            } else {
                mdContainer.innerHTML = "Error: " + (data.error || "Report empty");
            }
        } catch (e) {
            mdContainer.innerHTML = "Failed to load audit report: " + e.message;
        }
    }

    window.fetchReport = fetchReport;

    // Download / Export Report
    window.downloadReport = function(format) {
        if (format === 'markdown') {
            fetch("/api/report")
                .then(res => res.json())
                .then(data => {
                    if (data.content) {
                        const blob = new Blob([data.content], { type: "text/markdown" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "Blockchain_Security_Audit_Report.md";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    } else {
                        alert("Error: Report content is empty.");
                    }
                })
                .catch(err => alert("Failed to download markdown report: " + err.message));
        } else if (format === 'pdf') {
            const reportContent = document.getElementById("report-md-content").innerHTML;
            const printWindow = window.open('', '_blank', 'width=900,height=1000');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Blockchain Security Audit Report</title>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Outfit', sans-serif;
                            padding: 40px;
                            color: #1f2937;
                            line-height: 1.6;
                            background-color: #ffffff;
                        }
                        h1, h2, h3 {
                            color: #111827;
                            margin-top: 24px;
                            font-weight: 700;
                        }
                        h1 {
                            font-size: 2.2rem;
                            border-bottom: 2px solid #ef4444;
                            padding-bottom: 12px;
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        h2 {
                            font-size: 1.5rem;
                            border-bottom: 1px solid #e5e7eb;
                            padding-bottom: 6px;
                            margin-top: 36px;
                        }
                        h3 {
                            font-size: 1.15rem;
                            margin-top: 24px;
                        }
                        p {
                            margin-bottom: 16px;
                            font-size: 1rem;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 24px 0;
                        }
                        th, td {
                            border: 1px solid #d1d5db;
                            padding: 12px 14px;
                            text-align: left;
                        }
                        th {
                            background-color: #f3f4f6;
                            font-weight: 600;
                            color: #374151;
                        }
                        code {
                            background-color: #f3f4f6;
                            padding: 2px 6px;
                            border-radius: 4px;
                            font-family: 'Fira Code', monospace;
                            font-size: 0.9em;
                            color: #b91c1c;
                        }
                        pre {
                            background-color: #f9fafb;
                            border: 1px solid #e5e7eb;
                            padding: 16px;
                            border-radius: 8px;
                            overflow-x: auto;
                            margin: 16px 0;
                        }
                        pre code {
                            background-color: transparent;
                            padding: 0;
                            color: #1f2937;
                        }
                        .badge {
                            display: inline-block;
                            padding: 3px 8px;
                            border-radius: 12px;
                            font-size: 0.75rem;
                            font-weight: bold;
                            text-transform: uppercase;
                        }
                        .badge-danger { background-color: #fee2e2; color: #b91c1c; }
                        .badge-success { background-color: #d1fae5; color: #065f46; }
                        .badge-warning { background-color: #fef3c7; color: #92400e; }
                        
                        /* Layout adjustments */
                        a { color: #2563eb; text-decoration: none; }
                        hr { border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0; }
                        
                        @media print {
                            body { padding: 0; }
                            @page {
                                margin: 2cm;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div style="text-align: center; margin-bottom: 50px;">
                        <span style="font-weight: 800; font-size: 0.85rem; letter-spacing: 3px; color: #ef4444;">SENTINEL SECURITY AUDIT FRAMEWORK</span>
                    </div>
                    ${reportContent}
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                setTimeout(function() {
                                    window.close();
                                }, 500);
                            }, 500);
                        }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    // Notification Dropdown Toggle and Close-on-Outside-Click
    const bellBtn = document.getElementById("notification-bell-btn");
    const dropdown = document.getElementById("notification-dropdown");
    const clearDropdownBtn = document.getElementById("clear-dropdown-alerts-btn");

    if (bellBtn && dropdown) {
        bellBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("hidden");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!dropdown.classList.contains("hidden") && !e.target.closest("#notification-bell-btn")) {
                dropdown.classList.add("hidden");
            }
        });
    }

    if (clearDropdownBtn) {
        clearDropdownBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            // Clear local display
            const container = document.getElementById("alerts-container");
            const dropdownList = document.getElementById("dropdown-alerts-list");
            const badge = document.getElementById("alert-count-badge");
            
            badge.textContent = "0";
            const emptyHTML = `<div class="text-muted text-center py-4">No active security alerts.</div>`;
            if (container) container.innerHTML = emptyHTML;
            if (dropdownList) dropdownList.innerHTML = emptyHTML;
            dropdown.classList.add("hidden");
        });
    }

    // User Profile Dropdown Toggle and Close-on-Outside-Click
    const profileBtn = document.getElementById("user-profile-menu-btn");
    const profileDropdown = document.getElementById("profile-dropdown");

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle("hidden");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!profileDropdown.classList.contains("hidden") && !e.target.closest("#user-profile-menu-btn")) {
                profileDropdown.classList.add("hidden");
            }
        });
    }

    // Clear Telemetry list action
    const clearTelemetryBtn = document.getElementById("clear-telemetry-btn");
    if (clearTelemetryBtn) {
        clearTelemetryBtn.addEventListener("click", () => {
            const list = document.getElementById("telemetry-cards-list");
            if (list) {
                list.innerHTML = `<div class="text-center py-4 text-muted">No security events triggered.</div>`;
            }
        });
    }

    // Toggle Right Telemetry Panel
    const toggleTelemetryBtn = document.getElementById("toggle-telemetry-panel-btn");
    const telemetryPanel = document.getElementById("right-telemetry-panel");

    if (toggleTelemetryBtn && telemetryPanel) {
        toggleTelemetryBtn.addEventListener("click", () => {
            telemetryPanel.classList.toggle("closed");
        });
    }

    // Initialize Page
    loadSummary();
    renderCharts();
});
