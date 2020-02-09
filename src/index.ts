export interface FetchiQLOptions {
  mode: "cors" | "no-cors" | "same-origin";
  cache: "default" | "no-cache" | "reload" | "force-cache" | "only-if-cached";
  credentials?: "same-origin" | "include" | "omit";
  headers:
    | {
        [key: string]: string;
      }
    | Headers;
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
 * @name fetchiQL
 *
 * @summary
 * HTTP POST abstraction of a GraphQL network request with fetch.
 *
 * @description
 * Import the accompanying `controller` AbortController instance and call its
 * abort method to cancel the request, if necessary (i.e., a component making
 * the request is unrendered)
 *
 * @param {string|Request} resource URL or Request object
 *
 * @param {string} query GraphQL template query / mutation / subscription string
 *
 * @param {object} [variables={}] JavaScript object, whose keys are $variables in the query/mutation
 * and whose values are the corresponding values of the type specified by the GraphQL schema
 *
 * @param {FetchiQLOptions} options JavaScript object, whose properties override Fetch defaults,
 * excepting method, which is always 'POST'
 *
 * @returns {Promise} Resolves the data object (every response payload
 * within which will be accessible via the query/mutation name), or rejects an
 * array of error messages
 */
const fetchiQL = async (
  resource: string | Request,
  query: string,
  variables: unknown = {},
  options?: Partial<FetchiQLOptions>,
  abortController?: AbortController
) =>
  new Promise((resolve, reject) => {
    fetch(resource, {
      method: "POST",
      body: JSON.stringify({
        query,
        variables
      }),
      signal: abortController ? abortController.signal : undefined,
      ...options
    })
      .then(async res => {
        if (res.ok) return resolve((await res.json()).data);
        throw new Error(JSON.stringify((await res.json()).errors));
      })
      .catch(errors =>
        reject(
          JSON.parse(errors.message).map(
            (error: { message: string }) => error.message
          )
        )
      );
  });

/**
 * @name FetchiQLClient
 *
 * @summary
 * Class implementation of fetchiQL allowing you to use the same request options (i.e., headers)
 * for every request in your application.
 *
 * @param {string|Request} resource URL or Request object for your GraphQL endpoint
 *
 * @param {FetchiQLOptions} options JavaScript object whose properties override Fetch defaults,
 * excepting method, which is always 'POST'
 *
 * @returns {FetchiQLClient} Returns a FetchiQLClient object instance that can be used for every
 * request to the specified endpoint.
 */
export class FetchiQLClient implements FetchiQLOptions {
  resource: string | Request;
  /**
   * Declare instance properties with defaults (same as Fetch defaults)
   */
  mode: "cors" | "no-cors" | "same-origin" = "cors";
  cache: "default" | "no-cache" | "reload" | "force-cache" | "only-if-cached" =
    "default";
  credentials?: "same-origin" | "include" | "omit" = "same-origin";
  headers: { [key: string]: string } | Headers = {};
  redirect: "follow" | "manual" | "error" = "follow";
  referrerPolicy:
    | ""
    | "same-origin"
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "strict-origin"
    | "origin-when-cross-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url" = "no-referrer-when-downgrade";

  /**
   * @param resource
   * @param options
   * Override those options that have been provided by the library user
   */
  constructor(resource: string | Request, options?: Partial<FetchiQLOptions>) {
    this.resource = resource;
    this.mode = options && options.mode ? options.mode : this.mode;
    this.cache = options && options.cache ? options.cache : this.cache;
    this.credentials =
      options && options.credentials
        ? options && options.credentials
        : this.credentials;
    this.headers = options && options.headers ? options.headers : this.headers;
    this.redirect =
      options && options.redirect ? options.redirect : this.redirect;
    this.referrerPolicy =
      options && options.referrerPolicy
        ? options.referrerPolicy
        : this.referrerPolicy;
  }

  /**
   * @name FetchiQLClient.send Sends request to GraphQL API
   *
   * @description Instance method that applies the options specified in the constructor,
   * overrides those options if the user needs to for a particular request, applies a
   * unique user-created abortController if the user may need to cancel the request
   */
  send = async (
    query: string,
    variables: unknown = {},
    options?: Partial<FetchiQLOptions>,
    abortController?: AbortController
  ) =>
    new Promise((resolve, reject) => {
      fetch(this.resource, {
        method: "POST",

        body: JSON.stringify({
          query,
          variables
        }),

        // Apply the user's abortController, so that they may call its abort method if necessary
        signal: abortController ? abortController.signal : undefined,

        // Apply the request options
        ...{
          // First, apply the defaults or those options that the user specified in the constructor
          ...{
            mode: this.mode,
            cache: this.cache,
            credentials: this.credentials,
            redirect: this.redirect,
            referrerPolicy: this.referrerPolicy
          },

          // Override the options with anything the user specified directly in the method invocation
          ...options,

          /**
           * Because headers is an object type, merge in additional fields or obey any overrides from
           * the options object of the request after adding defaults or values passed via the constructor
           */
          headers: {
            ...this.headers,
            ...options?.headers
          }
        }
      })
        .then(async res => {
          // Fetch will resolve 400s and 500s, so check to make sure the request was OK
          if (res.ok) return resolve((await res.json()).data);

          // Otherwise, stringify the error messages
          throw new Error(JSON.stringify((await res.json()).errors));
        })

        .catch(errors => {
          // If the request was aborted, reject
          if (errors instanceof DOMException || errors.name === "AbortError") {
            return reject("Request aborted");
          }

          // Otherwise, reject the list of GraphQL errors
          return reject(
            JSON.parse(errors.message).map(
              (error: { message: string }) => error.message
            )
          );
        });
    });
}

export default fetchiQL;
