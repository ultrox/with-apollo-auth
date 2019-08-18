import { ApolloClient, InMemoryCache, } from 'apollo-boost'
import fetch from 'isomorphic-unfetch'
import { setContext } from 'apollo-link-context'

// not HttpLink from apollo-boost becouse we need it for more advance use
import { createHttpLink, } from 'apollo-link-http'

let apolloClient = null

// Polyfill fetch() on the server (used by apollo-client)
if (typeof window === 'undefined') {
  global.fetch = fetch
}

function create (initialState, { getToken }) {
  const httpLink = createHttpLink({
    uri: 'https://api.graph.cool/simple/v1/cj5geu3slxl7t0127y8sity9r',
    credentials: 'same-origin',
  })

  const authLink = setContext((_, { headers }) => {
    const token = getToken()
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : ''
      }
    }
  })

  // Check out https://github.com/zeit/next.js/pull/4611 if you want to use the AWSAppSyncClient
  const isBrowser = typeof window !== 'undefined'
  return new ApolloClient({
    connectToDevTools: isBrowser,
    ssrMode: !isBrowser, // Disables forceFetch on the server (so queries are only run once)
    link: authLink.concat(httpLink),
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
