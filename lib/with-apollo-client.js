import React from 'react'
import PropTypes from 'prop-types'
import cookie from 'cookie'
import initApollo from './init-apollo'
import Head from 'next/head'
import { getDataFromTree } from '@apollo/react-ssr'

function parseCookies (req, options = {}) {
  return cookie.parse(req ? req.headers.cookie || '' : document.cookie, options)
}

export default App => {
  return class Apollo extends React.Component {
    static displayName = 'withApollo(App)'

    static defaultProps = {
      // Required but, but not returned on the first pass, awoiding warnings
      apolloState: {}
    }

    static propTypes = {
      apolloState: PropTypes.object.isRequired
    }

    static async getInitialProps (context) {
      const { AppTree, ctx: { req, res } } = context

      // initialState  options -> ApolloClient
      const apollo = initApollo({}, { getToken: () => parseCookies(req).token })

      // make apollo available on ctx
      context.ctx.apolloClient = apollo

      let appProps = {}
      if (App.getInitialProps) {
        appProps = await App.getInitialProps(context)
      }


      if (res && res.finished) {
        // When redirecting, the response is finished.
        // No point in continuing to render
        return {}
      }

      if (typeof window === 'undefined') {
        try {
          // Run all GraphQL queries in the component tree
          // and extract the resulting data
          await getDataFromTree(<AppTree {...appProps} apolloClient={apollo} />)
        } catch (error) {
          // Prevent Apollo Client GraphQL errors from crashing SSR.
          // Handle them in components via the data.error prop:
          // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
          console.error('Error while running `getDataFromTree`', error)
        }

        // getDataFromTree does not call componentWillUnmount
        // head side effect therefore need to be cleared manually
        Head.rewind()
      }

      // Extract query data from the Apollo store
      const apolloState = apollo.cache.extract()

      return {
        ...appProps,
        apolloState
      }
    }

    constructor (props) {
      super(props)
      // `getDataFromTree` renders the component first, the client is passed off as a property.
      // After that rendering is done using Next's normal rendering pipeline
      this.apolloClient = initApollo(props.apolloState, {
        getToken: () => parseCookies().token
      })}

    render () {
      return <App apolloClient={this.apolloClient} {...this.props} />
    }
  }
}
