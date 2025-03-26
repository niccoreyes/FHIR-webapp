# Use the official Bun image
FROM oven/bun:latest

# Set the working directory inside the container
WORKDIR /app

# Copy package files and lock file first to leverage Docker cache
COPY package.json bun.lock* ./

# Copy configuration files needed for installation
COPY tsconfig.json next.config.mjs next.config.ts ./

# Install production dependencies using Bun
RUN bun install

# Copy the rest of the application code
COPY . .

RUN bun run build

# Expose the port used by your application (adjust if necessary)
EXPOSE 3000

# Run the application using Bun (adjust if your start script differs)
CMD ["bun", "run", "start"]
