export const abortController = new AbortController();

export interface FetchiQLOptions {
  mode: "cors" | "no-cors" | "same-origin";
  cache: "default" | "no-cache" | "reload" | "force-cache" | "only-if-cached";
  credentials?: "same-origin" | "include" | "omit";
  headers: {
    [key: string]: string;
  };
  redirect: "follow" | "manual" | "error";
  referrerPolicy:
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

/**
 * @summary
 * HTTP POST abstraction of a GraphQL network request with fetch.
 *
 * @description
 * Import the accompanying `controller` AbortController instance and call its
 * abort method to cancel the request, if necessary (i.e., a component making
 * the request is unrendered)
 * @param {string|Request} resource URL or Request object
 * @param {string} query GraphQL template query / mutation / subscription string
 * @param {object} [variables={}] JavaScript object
 *
 * @returns {Promise} Resolves the data object (every response payload
 * within which will be accessible via the query/mutation name), or rejects a
 * newline-separated rollup string of all query/mutation errors that occurred
 */
export default async (
  resource: string | Request,
  query: string,
  variables: unknown = {},
  options?: Partial<FetchiQLOptions>
) =>
  new Promise((resolve, reject) => {
    const signal = abortController.signal;
    fetch(resource, {
      method: "POST",
      body: JSON.stringify({
        query,
        variables
      }),
      signal,
      ...options
    })
      .then(async res => {
        if (res.ok) return resolve((await res.json()).data);
        throw new Error(JSON.stringify((await res.json()).errors));
      })
      .catch(errors => {
        const errorObj = JSON.parse(errors.message);
        return reject(
          errorObj.reduce((acc: string, current: Error) => {
            acc = `${acc}\n${current.message}`;
            return acc;
          }, "")
        );
      });
  });
