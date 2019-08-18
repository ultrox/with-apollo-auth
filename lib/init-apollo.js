import { ApolloClient, InMemoryCache, } from 'apollo-boost'
import fetch from 'isomorphic-unfetch'

// not HttpLink from apollo-boost becouse we need it for more advance use
import { createHttpLink, } from 'apollo-link-http'

let apolloClient = null

// Polyfill fetch() on the server (used by apollo-client)
if (typeof window === 'undefined') {
  global.fetch = fetch
}

function create (initialState) {
  const httpLink = createHttpLink({
    uri: 'https://api.graph.cool/simple/v1/cixmkt2ul01q00122mksg82pn',
    credentials: 'same-origin',
  })


  // Check out https://github.com/zeit/next.js/pull/4611 if you want to use the AWSAppSyncClient
  const isBrowser = typeof window !== 'undefined'
  return new ApolloClient({
    connectToDevTools: isBrowser,
    ssrMode: !isBrowser, // Disables forceFetch on the server (so queries are only run once)
    link: httpLink,
    cache: new InMemoryCache().restore(initialState || {}),
  })
}

export default function initApollo(initialState, options = {}) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (typeof window === 'undefined') {
    return create(initialState, { ...options })
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = create(initialState, options)
  }

  return apolloClient
}
