# FetchiQL

A simple front end framework agnostic Fetch wrapper for GraphQL

### The problem
Sending GraphQL requests without a GraphQL client like Apollo or Relay can be cumbersome, and if you're not using React, that's another story. FetchiQL allows you to send one-off GraphQL queries and mutations, as well as configure client instances you can pass around your application, so that all requests have the same configuration and headers.

### How it works
FetchiQL exports either a standalone function wrapping Fetch you can use for one-off requests, or a `FetchiQLClient` class, which (excepting `method` which need only be `POST`) can be configured with the same properties as Fetch. Because GraphQL requests are always sent to the same endpoint, `FetchiQLClient` only needs to be pointed to that endpoint once.

# Getting started

## Installation

Install `fetchiql`:
```
npm i fetchiql
```

For one-off requests, use the default export:
```
import fetchiQL from 'fetchiql'
```

To use the same configuration for multiple requests in your application, use the FetchiQLClient named export:
```
import { FetchiQLClient } from 'fetchiql'
```

# Setup

## Define one or more GraphQL queries

Here, we're exporting a query for pet objects defined in a directory dedicated to defining GraphQL queries.
```
// graphql/queries/pets.js
export default `
  query pets($where: PetsWhereClause) {
    pets(where: $where) {
      id
      householdName
      binomialClassification
      givenName
      gender
      temperament
    }
  }
`
```

## Define query variables
```
// Pets.js
const variables = {
  where: {
    binomialClassification: {
      equals: ['Felis catus'],
    },
    givenName: {
      equals: ['Michael'],
    }
  }
}
```

# Make a one-off request
Using the default export, which we've named `fetchiQL`, send a request:
```
// Pets.js
import fetchiQL from 'fetchiql'
import query from '../graphql/queries/pets'

const variables = {/* ... */}

fetchiQL('/graphql', query, variables)
  .then(data => console.log({ data }))
  .catch(errors => console.error({ errors })
```

`fetchiQL` returns a `Promise` that either resolves a `data` object or rejects an array of error strings. Because GraphQL supports resolving multiple queries and mutations per request, the object accessor for the data you need for each query/mutation is its name.

When `fetchiQL` rejects, it rolls up all of the errors returned from the GraphQL server into an array of strings.

# Make lots of requests with one config
`fetchiQL` is great for one-off requests, but if your application needs to make tens, hundreds, or thousands of GraphQL network calls, you can configure a `FetchiQLClient` that'll dispatch GraphQL requests with the same configuration every time. For example, if your server requires requests to be authorized with a JSON Web Token in the headers, you'll want to configure a `FetchiQLClient` with that header, and use it to send requests throughout your app.

## Configure a FetchiQLClient instance
```
// config/fetchiql.config.js
import { FetchiQLClient } from 'fetchiql'

// Example
const token = sessionStorage.getItem('token');

export const fetchiQL = new FetchiQLClient('http://localhost:3000/api/graphql', {
  headers: {
    'Authorization': `Bearer ${token}`
  },
})
```

## Use the `FetchiQLClient`'s send method

Once that's configured, you can import it anywhere and call its `send` method. The `send` method does provide an escape hatch which allows you to provide a configuration override object. For example, maybe a signup or signin mutation must be fired in the event that no bearer token is available.

```
// pets.js
import { fetchiQL } from '../config/fetchiql.config'
import query from '../graphql/queries/pets'

const variables = { /* ... */ }

const configOverrides = {
  headers: {
    Authorization: 'none needed', // override the authorization header from the config
    'Content-Type': 'application/json', // add an additional property not included in the config
}

fetchiQL.send(query, variables, configOverrides)
  .then(data => console.log({ data }))
  .catch(errors => console.error({ errors })
```

# Aborting requests
Sometimes, you need to be able to cancel a request. Like Fetch, FetchiQL is abortable. A parameter for an `AbortController` instance exists both for the one-off `fetchiQL` function and for `FetchiQLClient.send()`. Instantiate one and pass it in. Then, call that same `AbortController`'s `abort()` method wherever your framework has you do cleanup.

```
// Dogs.tsx
import React, { useEffect, useState } from 'react'
import PetDetail from './PetDetail'
import { fetchiQL } from 'fetchiql'
import { Pet } from '../types/interfaces/Pet'

const dogsQuery = `
  query pets($where: PetsWhereClause) {
    pets(where: $where) {
      id
      householdName
      binomialClassification
      givenName
      gender
      temperament
    }
  }
`

const dogVariables = {
  where: {
    binomialClassification: {
      equals: ['Canis lupus familiaris']
    },
    householdName: {
      equals: ['Dog', 'Puppy', 'Doggo', 'Pupperdoodle', 'Pup', 'Puppo', 'Borker', 'Pooch', 'Dorg', 'Doggie', 'Doge', 'Boofer', 'Woofer', 'Floof', 'Snooper']
    }
  }
}

const Dogs = () => {
  const [dogs, setDogs] = useState<Pet[]>([] as Pet[])

  useEffect(() => {
    // Instantiate an AbortController
    const abortController = new AbortController()

    // Pass the AbortController instance into fetchiQL
    fetchiQL('/api/graphql', query, dogVariables, abortController)
      .then(data => setDogs(data.dogs))
      .catch(errors => console.error(errors))
    
    // In React useEffect hooks, you can clean up your requests in an optionally returned function
    return () => abortController.abort()
  }, [fetchiQL])

  return (
    <>{dogs.map(dog => <PetDetail<Dog> pet={dog} />}</>)
  )
}
```

# API Reference

## `fetchiQL` Function Signature (default export)

```
fetchiQL(
  /* Usually the URL to your GraphQL API, but an object implementing browser's Request interface may also be used, just like Window.fetch() */
  request: string | Request,
  
  /* Valid GraphQL string containing one or many queries/mutations */
  query: string,
  
  /* GraphQL query variables -- any $variables used in your GraphQL will need to be top-level key names in this object
  */
  variables: Object<any>,
  
  /* OPTIONAL: Fetch options, excluding method (always 'POST'), see FetchiQLOptions interface for more details */
  options?: FetchiQLOptions,
  
  /* OPTIONAL: FetchiQL is abortable, just like Fetch. Instantiate your own instance of the AbortController class and provide it for this argument. Then, when the time comes to abort the request (i.e., the containing component unrenders), call its .abort() method */
  abortController?: AbortController
): Promise<any | string[]>
  
/* fetchiQL returns a Promise. If the Promise resolves, you'll be able to access the data for each query/mutation by its name on the `data` object. If the Promise rejects, you'll receive an array of strings indicating everything that went wrong. */
```

##`FetchiQLClient.send()` Method Signature
```
export const fetchiql = new FetchiQLClient('http://myapi.tech/api/graphql', {
  headers: {
    Authorization: `Bearer: ${token}`
  }
})

fetchiql.send(
  /* Valid GraphQL string containing one or many queries/mutations */
  query: string,
  
  /* GraphQL query variables -- any $variables used in your GraphQL will need to be top-level key names in this object
  */
  variables: Object<any>,
  
  /* OPTIONAL: config override options, excluding method (always 'POST'), see FetchiQLOptions interface for more details */
  options?: Partial<FetchiQLOptions>,
  
  /* OPTIONAL: FetchiQL is abortable, just like Fetch. Instantiate your own instance of the AbortController class and provide it for this argument. Then, when the time comes to abort the request (i.e., the containing component unrenders), call its .abort() method */
  abortController?: AbortController
): Promise<any | string[]>
  
/* FetchiQLClient.send() returns a Promise. If the Promise resolves, you'll be able to access the data for each query/mutation by its name on the `data` object. If the Promise rejects, you'll receive an array of strings indicating everything that went wrong. */
```

## interface `FetchiQLOptions`
The `FetchiQLClient` implements the `FetchiQLOptions` interface. The constructor overrides Fetch defaults upon instantiation. Partials can be provided in the constructor, in overrides within the `send()` method, or in one-off calls of the default export. For each of the properties listed below, Fetch defaults are listed first.
```
interface FetchiQLOptions {
  mode?: "cors" | "no-cors" | "same-origin";
  cache?: "default" | "no-cache" | "reload" | "force-cache" | "only-if-cached";
  credentials?: "same-origin" | "include" | "omit";
  headers?: {
    [key: string]: string;
  };
  redirect?: "follow" | "manual" | "error";
  referrerPolicy?:
    | ""
    | "same-origin"
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "strict-origin"
    | "origin-when-cross-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url";
}
```