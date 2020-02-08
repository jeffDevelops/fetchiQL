# FetchiQL

A simple Fetch POST wrapper for making GraphQL queries/mutations. Great for vanilla JavaScript or Svelte projects.

## Installation
```
npm i fetchiql
```

## Usage
**Available imports**
```
import fetchiql, { abortController, FetchiQLOptions } from 'fetchiql'
```

**Define one or more GraphQL queries**
```
const query = `
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
**Define query variables**
```
const variables = {
  where: {
    binomialClassification: {
      equals: 'Felis catus',
    },
    givenName: {
      equals: 'Michael',
    }
  }
}
```

**Send the request**
```
fetchiql('/graphql', query, variables, {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
.then(data => console.log(data.pets)) // Results of all queries/mutations will be accessible on the resolved data object
.catch((errors: string[]) => console.log(errors)) // Array of error messages

```

## Options
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

## Abort the request

The instance of the AbortController class passed as the fetch `signal` is exported as `abortController`. Call its `abort` method where needed to cancel the request.

**React**
```
import fetchiql, { abortController } from 'fetchiql'

// ...

useEffect(() => {
  fetchiql('/graphql', query, variables, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(data => console.log(data.pets))
  .catch((errors: string[]) => console.log(errors))

  return () => abortController.abort()
}, [])
```

**Svelte**
```
<script>
  import fetchiql, { abortController } from 'fetchiql'

  let data
  onMount(() => {
    fetchiql('/graphql', query, variables, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(data => console.log(data.pets))
    .catch((errors: string[]) => console.log(errors))

    return () => abortController.abort()
  })

  // ...

</script>
```

