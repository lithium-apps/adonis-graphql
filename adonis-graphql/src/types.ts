import { HttpContext } from '@adonisjs/core/http';
import { BuildSchemaOptions, ResolverData as BaseResolverData, NextFn } from 'type-graphql';
import { ApolloServerOptionsWithSchema, BaseContext } from '@apollo/server';


export type GraphQLServerConfig = {
    apollo: Omit<ApolloServerOptionsWithSchema<BaseContext>, 'schema'> & {
        playground: boolean
    }
} & Omit<BuildSchemaOptions, 'resolvers' | 'container'> & {
    path: string
    resolverPatterns?: string[]
}

export type GraphQLConfig = Record<string, GraphQLServerConfig>;

export type LazyImport<DefaultExport> = () => Promise<{ default: DefaultExport }>;

export type ResolverData = BaseResolverData<HttpContext>;

export interface GraphQLMiddleware {
    use(action: ResolverData, next: NextFn): Promise<any>;
}
