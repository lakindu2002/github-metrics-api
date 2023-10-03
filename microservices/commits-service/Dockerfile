# Use an official Node.js runtime as a base image
FROM node:18

# Set environment variables
ENV PORT=3002
ENV COMMITS_TABLE=IacStack-commits8C56C0A9-1E4MUM8XOVMZB
ENV AWS_REGION=ap-southeast-1

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
