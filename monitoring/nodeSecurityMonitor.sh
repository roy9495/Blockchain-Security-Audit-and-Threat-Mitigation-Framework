#!/bin/bash
# Ethereum Node Security Configuration Monitor

echo "🔍 Initiating Ethereum Node Security Audit..."

# Define RPC URL, defaulting to localhost Geth/Nethermind RPC
RPC_URL=${ETH_NODE_URL:-"http://localhost:8545"}

echo "Probing endpoint: $RPC_URL"

# 1. Probe connectivity & get client version
client_version=$(curl -s -m 3 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' \
  "$RPC_URL")

if [ -z "$client_version" ]; then
    echo "✅ RPC port is closed or not accessible externally (Recommended configuration)."
else
    echo "⚠️ WARNING: RPC endpoint is open and reachable."
    echo "   Node Client Version: $client_version"

    # 2. Check if dangerous admin namespace is exposed
    admin_probe=$(curl -s -m 3 -X POST \
      -H "Content-Type: application/json" \
      --data '{"jsonrpc":"2.0","method":"admin_nodeInfo","params":[],"id":1}' \
      "$RPC_URL")
      
    if [[ "$admin_probe" == *"result"* ]]; then
        echo "🚨 CRITICAL: Dangerous 'admin' RPC namespace is publicly exposed!"
    else
        echo "✅ 'admin' namespace is restricted / disabled."
    fi

    # 3. Check if debug/tracing namespace is exposed
    debug_probe=$(curl -s -m 3 -X POST \
      -H "Content-Type: application/json" \
      --data '{"jsonrpc":"2.0","method":"debug_traceTransaction","params":["0x0"], "id":1}' \
      "$RPC_URL")

    if [[ "$debug_probe" == *"method not found"* || -z "$debug_probe" ]]; then
        echo "✅ 'debug' namespace is restricted / disabled."
    else
        echo "⚠️ WARNING: 'debug' namespace is enabled."
    fi
fi

echo "✅ Ethereum Node security check completed."
