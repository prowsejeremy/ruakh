#!/bin/bash
# Build the Docker image, push it to the EC2 instance, and optionally restart Docker services
set -e;

SCRIPT_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"
source "$SCRIPT_DIR/print_message.sh"

printmessage "🚀 Starting the build and deployment process for the Docker image. This will take a few moments..."

# Build the Docker image using the build script
chmod +x $SCRIPT_DIR/build.sh
$SCRIPT_DIR/build.sh


# Deploy the Docker image to the EC2 instance using the deploy script
chmod +x $SCRIPT_DIR/rsync.sh
$SCRIPT_DIR/rsync.sh


printmessage "🎉 Deployment complete. Do you want to restart Docker on the EC2 instance? (y/n)"

read response
if [[ "$response" == "y" ]]; then
  printmessage "🔄 Restarting Docker on the EC2 instance."
  chmod +x $SCRIPT_DIR/start.sh
  $SCRIPT_DIR/start.sh
else
  printmessage "❌ Skipping Docker start."
fi


printmessage "✅ Build and deployment process finished successfully."

exit 0;