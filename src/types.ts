import type GraphQLServer from './graphql_server.js';

import type { HttpContext } from '@adonisjs/core/http';
import type { BuildSchemaOptions, ResolverData as BaseResolverData, NextFn } from 'type-graphql';
import type { ApolloServerOptionsWithSchema, BaseContext } from '@apollo/server';


export type GraphQLServerConfig = {
    apollo: Omit<ApolloServerOptionsWithSchema<BaseContext>, 'schema'> & {
        playground: boolean
    }
} & Omit<BuildSchemaOptions, 'resolvers' | 'container'> & {
    path: string
    resolverPatterns?: string[]
}

export type GraphQLService = {
    use(serverName: string): GraphQLServer
}

export type GraphQLConfig = Record<string, GraphQLServerConfig>;

export type LazyImport<DefaultExport> = () => Promise<{ default: DefaultExport }>;

export type ResolverData = BaseResolverData<HttpContext>;

export interface GraphQLMiddleware {
    use(action: ResolverData, next: NextFn): Promise<any>;
}
