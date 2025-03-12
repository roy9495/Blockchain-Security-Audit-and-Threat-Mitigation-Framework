#!/bin/bash
echo "Applying Ethereum Node Security Hardening..."

# Install fail2ban to prevent brute-force attacks
sudo apt install fail2ban -y

# Secure RPC endpoints (only allow localhost access)
iptables -A INPUT -p tcp --dport 8545 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 8545 -j DROP

echo "Security settings applied successfully!"
