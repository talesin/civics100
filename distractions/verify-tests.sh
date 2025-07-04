#!/bin/bash
cd /Users/jeremy/Documents/Code/civics100/distractions
echo "Running tests..."
npm run test 2>&1
echo "Exit code: $?"