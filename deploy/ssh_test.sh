#!/bin/bash
# SSH test script to verify connectivity to the EC2 instance

# Ensure you've set the following environment variables in connection_variables.sh:
SCRIPT_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"
source $SCRIPT_DIR/connection_variables.sh
source $SCRIPT_DIR/print_message.sh

printmessage "🔍 Testing SSH connection to the EC2 instance..."

ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST <<EOF
  set -e;

  echo ""
  echo "======================================================================"
  echo "✅ SSH connection to EC2 instance successful. You are logged in as:"
  whoami
  echo "======================================================================"
  echo ""

  exit 0;
EOF

[[ $? -ne 0 ]] && { printmessage "❌ SSH connection failed."; exit 1; }

exit 0;