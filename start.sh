#!/bin/bash

# AI Digital Case Manager - Start Script
# This script sets up and runs the entire application

set -e

echo "╔══════════════════════════════════════════════════════╗"
echo "║       AI Digital Case Manager - Setup & Start       ║"
echo "║       AI-Powered Nonprofit Case Management          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Function to kill processes on specific ports
cleanup_ports() {
  echo -e "${YELLOW}[1/6] Cleaning up ports 3000 and 3001...${NC}"
  for port in 3000 3001; do
    pid=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
      echo -e "  Killing process on port $port (PID: $pid)"
      kill -9 $pid 2>/dev/null || true
      sleep 1
    fi
  done
  echo -e "${GREEN}  Ports cleared.${NC}"
}

# Check for PostgreSQL
check_postgres() {
  echo -e "${YELLOW}[2/6] Checking PostgreSQL...${NC}"
  if ! command -v psql &> /dev/null; then
    echo -e "${RED}  PostgreSQL is not installed. Please install it first.${NC}"
    echo -e "  macOS: brew install postgresql@16 && brew services start postgresql@16"
    exit 1
  fi

  # Check if PostgreSQL is running
  if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
    brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || {
      echo -e "${RED}  Could not start PostgreSQL. Please start it manually.${NC}"
      exit 1
    }
    sleep 2
  fi
  echo -e "${GREEN}  PostgreSQL is running.${NC}"
}

# Setup database
setup_database() {
  echo -e "${YELLOW}[3/6] Setting up database...${NC}"

  # Create user and database if they don't exist
  psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='casemanager'" | grep -q 1 || \
    psql postgres -c "CREATE ROLE casemanager WITH LOGIN PASSWORD 'casemanager123';" 2>/dev/null || true

  psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='casemanager_db'" | grep -q 1 || \
    psql postgres -c "CREATE DATABASE casemanager_db OWNER casemanager;" 2>/dev/null || true

  # Grant privileges
  psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE casemanager_db TO casemanager;" 2>/dev/null || true
  psql casemanager_db -c "GRANT ALL ON SCHEMA public TO casemanager;" 2>/dev/null || true
  psql casemanager_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO casemanager;" 2>/dev/null || true

  echo -e "${GREEN}  Database ready.${NC}"
}

# Install dependencies
install_deps() {
  echo -e "${YELLOW}[4/6] Installing dependencies...${NC}"

  cd "$PROJECT_DIR/backend"
  if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo -e "  Installing backend dependencies..."
    npm install --silent 2>&1 | tail -1
  else
    echo -e "  Backend dependencies up to date."
  fi

  cd "$PROJECT_DIR/frontend"
  if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo -e "  Installing frontend dependencies..."
    npm install --silent 2>&1 | tail -1
  else
    echo -e "  Frontend dependencies up to date."
  fi

  cd "$PROJECT_DIR"
  echo -e "${GREEN}  Dependencies installed.${NC}"
}

# Seed database
seed_database() {
  echo -e "${YELLOW}[5/6] Seeding database...${NC}"
  cd "$PROJECT_DIR/backend"
  node seed.js
  cd "$PROJECT_DIR"
  echo -e "${GREEN}  Database seeded.${NC}"
}

# Start application
start_app() {
  echo -e "${YELLOW}[6/6] Starting application...${NC}"
  echo ""

  # Start backend with nodemon for hot reload
  cd "$PROJECT_DIR/backend"
  npx nodemon server.js &
  BACKEND_PID=$!

  # Start frontend with hot reload (built into react-scripts)
  cd "$PROJECT_DIR/frontend"
  BROWSER=none PORT=3000 npm start &
  FRONTEND_PID=$!

  cd "$PROJECT_DIR"

  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║              Application Started!                   ║${NC}"
  echo -e "${GREEN}╠══════════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║                                                     ║${NC}"
  echo -e "${GREEN}║  Frontend:  ${BLUE}http://localhost:3000${GREEN}                 ║${NC}"
  echo -e "${GREEN}║  Backend:   ${BLUE}http://localhost:3001${GREEN}                 ║${NC}"
  echo -e "${GREEN}║                                                     ║${NC}"
  echo -e "${GREEN}║  Login Credentials:                                 ║${NC}"
  echo -e "${GREEN}║  Email:    ${YELLOW}admin@casemanager.org${GREEN}                 ║${NC}"
  echo -e "${GREEN}║  Password: ${YELLOW}password123${GREEN}                           ║${NC}"
  echo -e "${GREEN}║                                                     ║${NC}"
  echo -e "${GREEN}║  Hot reload enabled - changes auto-refresh          ║${NC}"
  echo -e "${GREEN}║  Press Ctrl+C to stop all services                  ║${NC}"
  echo -e "${GREEN}║                                                     ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"

  # Trap SIGINT to cleanup
  trap "echo ''; echo -e '${YELLOW}Shutting down...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; cleanup_ports; echo -e '${GREEN}Goodbye!${NC}'; exit 0" SIGINT SIGTERM

  # Wait for both processes
  wait
}

# Run all steps
cleanup_ports
check_postgres
setup_database
install_deps
seed_database
start_app
