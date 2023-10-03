# Use an official Node.js runtime as a base image
FROM node:18

# Set environment variables
ENV PORT=3004
ENV ISSUES_TABLE=IacStack-issuesA71BD65A-1EB3UGKRPRX72
ENV AWS_REGION=ap-southeast-1
ENV ORG_NAME=lodash

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies (creates a separate layer)
RUN npm install

# Copy the application code to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE $PORT

# Define the command to run your application
CMD ["npm", "start"]
