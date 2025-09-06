FROM python:3.11-slim

# Install dependencies: curl, build tools, git, Node.js LTS
RUN apt-get update && apt-get install -y \
    curl ca-certificates build-essential git && rm -rf /var/lib/apt/lists/*

# Install Node.js LTS 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy dependency files
COPY requirements.txt package*.json ./

# Install Python deps
RUN pip install --no-cache-dir -r requirements.txt

# Install Node deps
RUN npm install --production

# Copy all source code
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Expose ports
EXPOSE 5000 5001

# Entrypoint
CMD ["/app/start.sh"]
