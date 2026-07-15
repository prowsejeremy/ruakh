#!/bin/bash
# rsync files to ec2 instance

# Ensure you've set the following environment variables in connection_variables.sh:
SCRIPT_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"
source $SCRIPT_DIR/connection_variables.sh
source $SCRIPT_DIR/print_message.sh

printmessage "📤 Starting the file synchronization process to the EC2 instance. 📥"

rsync -avzc --delete-after \
  -e "ssh -i $EC2_KEY_PATH" \
  $SCRIPT_DIR/../ruakh-image.tar \
  $SCRIPT_DIR/../docker/compose.yml \
  $SCRIPT_DIR/../docker/nginx \
  $EC2_USER@$EC2_HOST:$EC2_APP_DIR

[[ $? -ne 0 ]] && { printmessage "❌ File synchronization failed."; exit 1; }

printmessage "✅ File synchronization complete."

exit 0;