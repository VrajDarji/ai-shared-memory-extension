#!/bin/bash

# Railway deployment script for SabkiSoch Backend
echo "🚀 Starting SabkiSoch Backend on Railway..."

# Set environment variables if not already set
export PORT=${PORT:-8000}
export HOST=${HOST:-0.0.0.0}

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run the FastAPI application
echo "🌐 Starting FastAPI server on port $PORT..."
uvicorn app:app --host $HOST --port $PORT
