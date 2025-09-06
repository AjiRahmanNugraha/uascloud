# backend/Dockerfile
FROM python:3.11-slim AS pybuild

# Install Node later from node image; but we'll use single final image based on Debian slim and install Node + Python
RUN apt-get update && apt-get install -y curl ca-certificates build-essential git && rm -rf /var/lib/apt/lists/*

# Install Node.js (LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
  && apt-get install -y nodejs

# Install python deps
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . /app

# Install npm deps
RUN npm install --production

# Make start script executable
RUN chmod +x /app/start.sh

EXPOSE 5000 5001

# Entrypoint: start Python server in background then start Node
CMD ["/app/start.sh"]
