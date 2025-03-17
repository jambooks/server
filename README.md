# @jambooks/server

## Description
This is the express.js app that is backend of the jambooks.com website. A running mongodb and redis servers are required
for this project to run.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Directory structure](#directory-structure)

## Installation
1. Clone the repository:
   ```sh
   git clone git@github.com:jambooks/server.git
2. Navigate to project directory:
    ```sh
    cd server
3. Install dependencies:
    ```sh
    npm install
4. Clone and Install @jambooks/shared
5. Navigate to shared project directory:
    ```sh
   cd shared
5. NPM Link @jambooks/shared
    ```sh
   npm link
6. Navigate back to server directory
    ```sh
   cd server
7. Link @jambooks/shared into server
    ```sh
   npm link @jambooks/shared
   
  
## Usage
```sh
  npm run server-local
```
## Configuration
Create a .env file in the root directory and configure the following variables:
```sh
   JAM_ALEXANDERS_API_KEY="your-alexanders-api-key"
   JAM_API_TOKEN="your-api-token"
   JAM_AWS_ACCESS_KEY="your-aws-access-key"
   JAM_AWS_ACCESS_SECRET="your-aws-access-secret"
   JAM_EXPRESS_SESSION_REDIS_URL="your-express-session-url"
   JAM_MONGODB_URL="your-mongodb-url"
   JAM_QUEUE_REDIS_HOST="your-queue-redis-host"
   JAM_QUEUE_REDIS_PORT="your-queue-redis-port"
   JAM_SENDGRID_APIKEY="your-send-grid-api-key"
   JAM_STRIPE_ENDPOINT_SECRET="your-stripe-endpoint"
   JAM_STRIPE_KEY="your-stripe-key"
   JAM_STRIPE_SECRET="your-stripe-secret"
   JAM_TWILIO_SERVICESID="your-twilio-serviceid"
   JAM_TWILIO_SID="your-twilio-sid"
   JAM_TWILIO_TOKEN="your-twilio-token"
```
## Environment variables
- `JAM_ALEXANDERS_API_KEY` - Key used to publish books
- `JAM_API_TOKEN` - String passed from queue server to app server
- `JAM_AWS_ACCESS_KEY` - 
- `JAM_AWS_ACCESS_SECRET` - your-aws-access-secret
- `JAM_BROWSERLESS_KEY` - your-browserless-key
- `JAM_EXPRESS_SESSION_REDIS_URL` your-express-session-url
- `JAM_MONGODB_URL` - your-mongodb-url
- `JAM_QUEUE_REDIS_HOST` - your-queue-redis-host
- `JAM_QUEUE_REDIS_PORT` - your-queue-redis-port
- `JAM_SENDGRID_APIKEY` - your-send-grid-api-key
- `JAM_STRIPE_ENDPOINT_SECRET` - your-stripe-endpoint
- `JAM_STRIPE_KEY` - your-stripe-key
- `JAM_STRIPE_SECRET` - your-stripe-secret
- `JAM_TWILIO_SERVICESID` - your-twilio-serviceid
- `JAM_TWILIO_SID` - your-twilio-sid
- `JAM_TWILIO_TOKEN` - your-twilio-token

# Directory structure

## controllers

Most of the main business logic will be written in the controllers. Controllers are responsible for defining the main 
actions that should be performed for a particular route and for calling any necessary services or models to perform 
those actions.

Controllers are where coupling of services and models take place.

## cron

Jobs that are run in a schedule on the server. These will all be replace by SQS queues.

## lib

Modules that contain code that is used in more than one place in the system.

## loaders

Loaders modules used to set up parts of the system.

## middleweares

Middlewares are used in the routes. Usually checking authentication or permissions for an authenticated user.

## public

Files that get compiled from other parts of the system.

## routes

Contains all the route handlers for different parts of the application. Routes combine middlewares and controller code 
to handle requests. Some error handling is the responsiblity of each route.
