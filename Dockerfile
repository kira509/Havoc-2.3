# Use official Node.js image
FROM node:20

# Install required dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends && apt-get clean

# Set environment variable for Puppeteer path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set timezone (optional)
ENV TZ=Africa/Nairobi

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Start the bot via index.js
CMD ["node", "index.js"]
