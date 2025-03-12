import os
import json
import requests
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv()
API_KEY = os.getenv("CHAINALYSIS_API_KEY")
API_URL = os.getenv("CHAINALYSIS_API_URL", "https://api.chainalysis.com/api/v1")

# Headers for API requests
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def check_wallet_address(address):
    """Check if a wallet address is flagged for illicit activity."""
    url = f"{API_URL}/address/{address}"
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        data = response.json()
        return data  # Returns full risk report
    else:
        return {"error": "Failed to fetch data", "status_code": response.status_code}

def scan_transactions(file_path):
    """Scan transactions for compliance violations."""
    try:
        with open(file_path, "r") as file:
            transactions = json.load(file)

        flagged_transactions = []

        for tx in transactions:
            sender = tx.get("from")
            receiver = tx.get("to")
            amount = tx.get("value")

            sender_data = check_wallet_address(sender)
            receiver_data = check_wallet_address(receiver)

            if sender_data.get("riskScore", 0) > 75 or receiver_data.get("riskScore", 0) > 75:
                flagged_transactions.append({
                    "tx_hash": tx["hash"],
                    "sender": sender,
                    "receiver": receiver,
                    "amount": amount,
                    "sender_risk": sender_data.get("riskScore"),
                    "receiver_risk": receiver_data.get("riskScore"),
                })

        return flagged_transactions

    except Exception as e:
        return {"error": str(e)}

def main():
    """Main function to scan transactions and print flagged results."""
    transactions_file = "transactions.json"
    
    if not os.path.exists(transactions_file):
        print("❌ Error: transactions.json not found!")
        return
    
    print("🚀 Scanning transactions for compliance violations...")
    flagged = scan_transactions(transactions_file)

    if flagged:
        print(f"⚠️ {len(flagged)} suspicious transactions found:")
        for tx in flagged:
            print(f"- Tx Hash: {tx['tx_hash']}")
            print(f"  Sender Risk: {tx['sender_risk']}, Receiver Risk: {tx['receiver_risk']}")
            print(f"  Amount: {tx['amount']} ETH\n")
    else:
        print("✅ No high-risk transactions detected.")

if __name__ == "__main__":
    main()
