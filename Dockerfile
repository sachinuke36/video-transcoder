FROM node:20-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Install Whisper
RUN pip3 install --no-cache-dir openai-whisper

# Copy source code
COPY . .

# Create required directories
RUN mkdir -p uploads storage thumbnails

# Expose API port
EXPOSE 3000

# Default command
CMD ["npm", "run", "dev:all"]
