# Use an official Node.js runtime as a base image
FROM public.ecr.aws/docker/library/node:current-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies and build (creates a separate layer)
RUN npm install --legacy-peer-deps

COPY dist .

# Expose the port the app runs on
EXPOSE 3002

# Define the command to run your application
CMD ["node", "index.js"]
