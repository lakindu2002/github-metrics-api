# Use an official Node.js runtime as a base image
FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:current-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

ENV RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/%2F
ENV AWS_ACCESS_KEY=AKIA5SAWUVKQJJMI66PG
ENV AWS_SECRET_ACCESS=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
ENV COMMITS_TABLE=IacStackDynamoStackE396051D-commits8C56C0A9-11C8CDQXPR5AW

# Install application dependencies and build (creates a separate layer)
RUN npm install --legacy-peer-deps

COPY dist .

# Expose the port the app runs on
EXPOSE 3002

# Define the command to run your application
CMD ["node", "index.js"]
