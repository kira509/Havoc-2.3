# Use the official Node image
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install

# Expose the port if needed (for Express UI)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
