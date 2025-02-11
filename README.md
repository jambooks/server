# Server structure

## config

All the system configure lives here.

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

## services

Encapsulate specific functionality and can be used by multiple parts of the application, including controllers. Services 
are often used to abstract away complex or repetitive logic and make it easier to manage and test.

Services should not be tigtly coupled with anything but models. Services can use models to modify data.

The main difference between a model and a service is that the model is concerned with how the data is 
stored and retrieved, while the service is concerned with what the data represents and how it should be used within 
the context of the application. By separating these concerns, you can keep your code clean, organized, and easy to 
maintain.