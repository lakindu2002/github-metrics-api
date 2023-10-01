# DeveloperIQ

This is a tool that consumes the GitHub Developer API to build a tool that assesses developer productivity.

To do so, this API takes into account the following metrics offered by the GitHub API:

1. Number of Commits Made by a Particular User
2. Number of PRs Closed by a Particular User
3. Number of Issues Assigned to a Particular User

Therefore, each component has been broken down in its own microservice:

1. Commit API - Maintain connections between GitHub Commit API
2. Issues API - Maintain connections for GitHub Issues
3. Pull Requests API - Maintains connections for GitHub PRs

Apart from that, there are two more services that are built for this app:

1. Scheduler Service: This service will run daily and collect data for a series of users

An API Gateway will be provisioned to act as the ingress API.