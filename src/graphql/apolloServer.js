import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { typeDefs } from './typeDefs.js';
import { resolvers } from './resolvers.js';

const isProduction = process.env.NODE_ENV === 'production';

export const createApolloServer = () => {
  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: !isProduction,
    plugins: [
      !isProduction
        ? ApolloServerPluginLandingPageLocalDefault({
            embed: true,
            includeCookies: true,
          })
        : ApolloServerPluginLandingPageDisabled(),
    ],
  });
};
