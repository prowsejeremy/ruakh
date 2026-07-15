#!/bin/bash
# Install Docker and Docker Compose on the EC2 instance

# SSH into the EC2 instance

# Ensure you've set the following environment variables in connection_variables.sh:
SCRIPT_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"
source $SCRIPT_DIR/connection_variables.sh
source $SCRIPT_DIR/print_message.sh

ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST <<EOF
  set -e;

  # Install Docker
  if ! docker version &> /dev/null; then
    echo ""
    echo "==================================="
    echo "⬇️ Docker not found, installing..."
    echo "==================================="
    echo ""

    sudo yum update -y
    sudo yum install docker -y
    sudo service docker start

    # Update user permissions to allow running Docker without sudo
    sudo usermod -aG docker ec2-user

    # Ensure Docker starts on boot
    sudo systemctl enable docker.service
    sudo systemctl start docker.service

    exit 0;
  else
    echo ""
    echo "======================================================"
    echo "✅ Docker is already installed, skipping installation."
    echo "======================================================"
    echo ""
  fi

  exit 0;
EOF

[[ $? -ne 0 ]] && { printmessage "❌ Failed to install Docker."; exit 1; }


ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST <<EOF
  set -e;

  # Install Docker Compose
  if ! docker compose version &> /dev/null; then
    echo ""
    echo "=========================================="
    echo "⬇️ Docker Compose not found, installing..."
    echo "=========================================="
    echo ""

    sudo mkdir -p /usr/local/lib/docker/cli-plugins
    sudo curl -SL https://github.com/docker/compose/releases/download/v5.0.1/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    
    docker compose version
  else
    echo ""
    echo "=============================================================="
    echo "✅ Docker Compose is already installed, skipping installation."
    echo "=============================================================="
    echo ""
  fi

  exit 0;
EOF

[[ $? -ne 0 ]] && { printmessage "❌ Failed to install Docker Compose."; exit 1; }

printmessage "✅ Docker and Docker Compose installed successfully on the EC2 instance."

exit 0;