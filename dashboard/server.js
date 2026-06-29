const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const net = require("net");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const WORKSPACE_DIR = path.resolve(__dirname, "..");

// Ensure incident response logs folder exists
const logsDir = path.join(WORKSPACE_DIR, "incident-response", "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// In-memory monitoring states and alerts
let activeMonitors = {
    onChain: true,
    reentrancy: false,
    flashLoan: false,
    crossChain: false,
};

let alerts = [
    { id: 1, type: "info", title: "Monitoring Initialized", message: "Ethereum transactions monitor started on watchlisted addresses.", timestamp: new Date().toLocaleTimeString() },
];

let contractPauses = {
    Vulnerable: false,
    VulnerableLending: false,
    InsecureBridge: false,
    IntegerOverflow: false
};

const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".md": "text/markdown",
};

// Helper to check RPC Node Port
function probePort(host, port, timeout = 1000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let status = "closed";

        socket.setTimeout(timeout);
        socket.on("connect", () => {
            status = "open";
            socket.destroy();
        });
        socket.on("timeout", () => {
            socket.destroy();
        });
        socket.on("error", () => {
            socket.destroy();
        });
        socket.on("close", () => {
            resolve(status);
        });

        socket.connect(port, host);
    });
}

// Simple JSON request body parser helper
function parseBody(req) {
    return new Promise((resolve) => {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                resolve({});
            }
        });
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // API Routes
    if (pathname.startsWith("/api/")) {
        res.writeHead(200, { "Content-Type": "application/json" });

        if (pathname === "/api/summary") {
            // Static analysis summary
            const data = {
                securityScore: 85,
                vulnerabilities: { critical: 2, high: 1, medium: 1, resolved: 4 },
                networkMonitorStatus: activeMonitors,
                alertCount: alerts.length,
                pauses: contractPauses
            };
            return res.end(JSON.stringify(data));
        }

        if (pathname === "/api/report") {
            const reportPath = path.join(WORKSPACE_DIR, "Audits", "smart-contracts", "Report.md");
            try {
                const content = fs.readFileSync(reportPath, "utf-8");
                return res.end(JSON.stringify({ content }));
            } catch (err) {
                return res.end(JSON.stringify({ error: "Audit report not found", details: err.message }));
            }
        }

        if (pathname === "/api/contracts") {
            // Load source files for side-by-side
            const contracts = {
                reentrancy: {
                    name: "Reentrancy Attack",
                    vulnPath: "src/vulnerable-smart-contracts/Vulnerable.sol",
                    secPath: "src/vulnerable-smart-contracts/Secure.sol",
                    vulnCode: "",
                    secCode: "",
                    description: "Reentrancy allows an attacker to recursively call back into the withdraw function before the user balance state is updated, draining the contract's entire balance."
                },
                overflow: {
                    name: "Integer Overflow",
                    vulnPath: "src/vulnerable-smart-contracts/IntegerOverflow.sol",
                    secPath: "src/secure-smart-contracts/IntegerOverflow.sol",
                    vulnCode: "",
                    secCode: "",
                    description: "Solidity 0.8+ reverts on overflow automatically, but wrapping logic in 'unchecked' blocks bypasses this safety, leading to balance wrap-arounds."
                },
                flashloan: {
                    name: "Unprotected Flash Loan",
                    vulnPath: "src/vulnerable-smart-contracts/VulnerableLending.sol",
                    secPath: "src/secure-smart-contracts/VulnerableLending.sol",
                    vulnCode: "",
                    secCode: "",
                    description: "Lending pool provides flash loans but fails to assert that the borrower returned the assets plus premium at the end of the transaction."
                },
                bridge: {
                    name: "Cross-Chain Bridge Security",
                    vulnPath: "src/interoperability/InsecureBridge.sol",
                    secPath: "src/interoperability/SecureBridge.sol",
                    vulnCode: "",
                    secCode: "",
                    description: "Cross-chain message handling lacks validator signature gating and signature nonces, letting arbitrary agents spoof messages and replay transactions."
                }
            };

            for (const key in contracts) {
                try {
                    contracts[key].vulnCode = fs.readFileSync(path.join(WORKSPACE_DIR, contracts[key].vulnPath), "utf-8");
                } catch {
                    contracts[key].vulnCode = "// Failed to load vulnerable contract";
                }
                try {
                    contracts[key].secCode = fs.readFileSync(path.join(WORKSPACE_DIR, contracts[key].secPath), "utf-8");
                } catch {
                    contracts[key].secCode = "// Failed to load secure contract";
                }
            }

            return res.end(JSON.stringify(contracts));
        }

        if (pathname === "/api/run-tests") {
            const vulnType = url.searchParams.get("type") || ""; // 'reentrancy', 'overflow', etc.
            let grepPattern = "";
            if (vulnType) {
                const mapping = {
                    "reentrancy_Vulnerable": "Vulnerable Reentrancy",
                    "reentrancy_Secure": "Secure Reentrancy",
                    "overflow_Vulnerable": "wrap around",
                    "overflow_Secure": "SafeMath",
                    "flashloan_Vulnerable": "Vulnerable Flash Loan",
                    "flashloan_Secure": "Secure Flash Loan",
                    "bridge_Vulnerable": "Insecure Bridge",
                    "bridge_Secure": "Secure Bridge"
                };
                grepPattern = mapping[vulnType] || vulnType;
            }
            let command = grepPattern ? `npx hardhat test --grep "${grepPattern}"` : "npm run test";

            exec(command, { cwd: WORKSPACE_DIR }, (error, stdout, stderr) => {
                const logs = stdout + "\n" + stderr;
                const success = !error;
                return res.end(JSON.stringify({ success, logs }));
            });
            return;
        }

        if (pathname === "/api/run-compliance") {
            // Read compliance from JSON and run python compliance script if possible
            const isWindows = process.platform === "win32";
            const pythonCmd = isWindows ? "py" : "python3";
            const cmd = `${pythonCmd} "${scriptPath}"`;

            exec(cmd, { cwd: WORKSPACE_DIR }, (error, stdout, stderr) => {
                let logs = stdout + "\n" + stderr;
                // Parse the mock database transactions as well to return structured results
                let transactions = [];
                try {
                    transactions = JSON.parse(fs.readFileSync(path.join(WORKSPACE_DIR, "tools", "chainalysis", "transactions.json"), "utf-8"));
                    transactions = transactions.map(tx => {
                        const isHighRisk = tx.from === "0xHighRiskAddress" || tx.from.includes("HighRisk");
                        return {
                            ...tx,
                            riskScore: isHighRisk ? 90 : 15,
                            status: isHighRisk ? "High Risk (Flagged)" : "Low Risk",
                            classification: isHighRisk ? "Tornado Cash Link" : "Standard Transfer"
                        };
                    });
                } catch (e) {
                    logs += "\nFailed to read transactions: " + e.message;
                }

                return res.end(JSON.stringify({
                    success: !error,
                    logs,
                    transactions
                }));
            });
            return;
        }

        if (pathname === "/api/probe-node") {
            // Probe default local geth node at 8545
            const urlString = process.env.ETH_NODE_URL || "http://localhost:8545";
            let host = "localhost";
            let port = 8545;

            try {
                const u = new URL(urlString);
                host = u.hostname || "localhost";
                port = u.port || 8545;
            } catch {}

            const status = await probePort(host, port);
            const report = {
                timestamp: new Date().toISOString(),
                endpoint: urlString,
                portStatus: status,
                exposedNamespaces: {
                    admin: "restricted",
                    debug: "restricted"
                },
                recommendations: []
            };

            if (status === "open") {
                report.recommendations.push("⚠️ WARNING: RPC endpoint is open and reachable.");
                report.recommendations.push("🚨 CRITICAL: Ensure admin or debug RPC namespaces are disabled in production.");
            } else {
                report.recommendations.push("✅ RPC port is closed or not accessible externally (Recommended configuration).");
            }

            return res.end(JSON.stringify(report));
        }

        if (pathname === "/api/monitors" && req.method === "GET") {
            return res.end(JSON.stringify(activeMonitors));
        }

        if (pathname === "/api/monitors" && req.method === "POST") {
            const body = await parseBody(req);
            activeMonitors = { ...activeMonitors, ...body };
            // Add alert for monitor status change
            alerts.unshift({
                id: Date.now(),
                type: "info",
                title: "Monitor Configuration Updated",
                message: `Active monitors: ${Object.keys(activeMonitors).filter(k => activeMonitors[k]).join(", ") || "None"}`,
                timestamp: new Date().toLocaleTimeString()
            });
            return res.end(JSON.stringify({ success: true, activeMonitors }));
        }

        if (pathname === "/api/alerts") {
            return res.end(JSON.stringify(alerts));
        }

        if (pathname === "/api/trigger-incident") {
            const body = await parseBody(req);
            const txHash = body.txHash || "0x" + Math.random().toString(16).slice(2, 10) + "...";
            const type = body.type || "reentrancy";
            
            // Log saving simulator (similar to incidentHandler.js)
            const traceLogs = {
                timestamp: new Date().toISOString(),
                txHash,
                type,
                contractState: "Vulnerable",
                callDepth: type === "reentrancy" ? 6 : 1,
                gasUsed: 120000,
                mitigationStatus: "Triggering pause actions..."
            };

            const incidentLogPath = path.join(logsDir, `${txHash.slice(0, 10)}.json`);
            try {
                fs.writeFileSync(incidentLogPath, JSON.stringify(traceLogs, null, 4));
            } catch (err) {
                console.error("Failed to save log file: ", err.message);
            }

            const alertTitle = type.toUpperCase() + " Incident Detected";
            const alertMsg = `Suspicious transaction ${txHash} triggered incident playbook. Captured trace logs.`;

            alerts.unshift({
                id: Date.now(),
                type: "danger",
                title: alertTitle,
                message: alertMsg,
                timestamp: new Date().toLocaleTimeString(),
                txHash,
                logFile: incidentLogPath
            });

            return res.end(JSON.stringify({
                success: true,
                message: "Incident captured successfully",
                traceLogs,
                logPath: incidentLogPath
            }));
        }

        if (pathname === "/api/pause-contracts") {
            const body = await parseBody(req);
            const contract = body.contract;
            if (contract && contractPauses[contract] !== undefined) {
                contractPauses[contract] = !contractPauses[contract];
                alerts.unshift({
                    id: Date.now(),
                    type: contractPauses[contract] ? "warning" : "success",
                    title: contractPauses[contract] ? "Contract Paused" : "Contract Unpaused",
                    message: `${contract} security pause switch is now ${contractPauses[contract] ? "ON" : "OFF"}.`,
                    timestamp: new Date().toLocaleTimeString()
                });
                return res.end(JSON.stringify({ success: true, pauses: contractPauses }));
            }
            return res.end(JSON.stringify({ error: "Invalid contract target" }));
        }

        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "API Route not found" }));
    }

    // Static Files Router
    let filePath = pathname === "/" ? "index.html" : pathname.substring(1);
    const absPath = path.join(PUBLIC_DIR, filePath);

    // Security Check: prevent reading outside public folder
    if (!absPath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        return res.end("Forbidden");
    }

    const ext = path.extname(absPath);
    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(absPath, (err, content) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("404 Not Found");
            } else {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Internal Server Error: " + err.code);
            }
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`✨ Dashboard Server is running at http://localhost:${PORT}`);
    console.log(`💡 Press Ctrl+C to stop the dashboard server.`);
});
