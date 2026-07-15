#!/bin/bash
# This script prints a message in a formatted box. It takes a single argument, which is the message to be printed.

# Check if an input message was provided
printmessage() {
  MESSAGE="$1"
  # Check if an input message was provided
  if [ -z "$MESSAGE" ]; then
    echo "Usage: printmessage 'Your message here'"
    return 1
  fi

  # Calculate the length of the string
  LENGTH=${#MESSAGE}
  # Define the border character
  BORDER_CHAR="="

  # Create the top/bottom line (length of message + 4 for padding/side bars)
  BORDER=$(printf "%0.s$BORDER_CHAR" $(seq 1 $((LENGTH + 4))))

  # Output the formatted message
  echo ""
  echo "$BORDER"
  echo "$MESSAGE"
  echo "$BORDER"
  echo ""
}