import { Server } from 'node:http';
import { WebSocketServer } from 'ws';
import { buildSchema } from 'type-graphql';
import { useServer } from 'graphql-ws/use/ws';
import { ApolloServer } from '@apollo/server';
import { Logger } from '@adonisjs/core/logger';
import { HttpContext } from '@adonisjs/core/http';
import { ContainerResolver } from '@adonisjs/core/container';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';

import { authChecker } from './auth_checker.js';
import { baseScalars } from './scalars/index.js';
import { adonisToGraphqlRequest, graphqlToAdonisResponse } from './utils/apollo.js';

import type { GraphQLSchema } from 'graphql';
import type { GraphQLServerConfig, LazyImport } from './types.js';
import type { ContainerBindings, HttpRouterService } from '@adonisjs/core/types';


export default class GraphQLServer {
    public readonly name: string;

    #resolvers: LazyImport<Function>[] = [];
    #container: ContainerResolver<ContainerBindings>;
    #config: GraphQLServerConfig;
    #logger: Logger;
    #apollo?: ApolloServer;

    constructor(name: string, config: GraphQLServerConfig, container: ContainerResolver<ContainerBindings>, logger: Logger) {
        this.name = name;
        this.#config = config;
        this.#container = container;
        this.#logger = logger;
    }

    /**
     * Get the Apollo Server instance
     * @returns {ApolloServer} - The Apollo Server instance
     * @throws {Error} - If the Apollo Server has not been configured yet
     */
    public get apollo() {
        if (!this.#apollo) {
            throw new Error('ApolloServer has not been configured yet');
        }

        return this.#apollo;
    }

    /**
     * Set the resolvers for the GraphQL schema
     * @param resolvers {LazyImport<Function>[]} - An array of lazy imports for resolver classes
     */
    public async setResolvers(resolvers: LazyImport<Function>[]) {
        this.#resolvers = resolvers;
    }

    /**
     * Start the Apollo Server and WebSocket server (if configured)
     * @param server {Server} - The Node HTTP server instance.
     */
    public async start(server: Server) {
        const schema = await this.#buildSchema();

        await this.#startApollo(schema);
        await this.#startWebsocket(schema, server);
    }

    /**
     * Handle an incoming HTTP request and pass it to Apollo Server
     * @param ctx {HttpContext} - The HTTP context
     */
    public async handle(ctx: HttpContext) {
        const apollo = this.#apollo;
        if (!apollo) {
            this.#logger.warn(`[${this.name}] Tried to access Apollo Server when not initialized`);
            return;
        }

        if ('auth' in ctx) {
            await (ctx.auth as any).check();
        }

        const httpGraphQLRequest = adonisToGraphqlRequest(ctx.request);
        const httpGraphQLResponse = await apollo.executeHTTPGraphQLRequest({
            httpGraphQLRequest,
            context: async () => ctx,
        });

        return graphqlToAdonisResponse(ctx.response, httpGraphQLResponse);
    }

    /**
     * Register the GraphQL route with the given router
     * @param router {HttpRouterService} - The router instance to register the route with
     */
    public registerRoute(router: HttpRouterService) {
        router.route(this.#config.path, ['GET', 'POST', 'PATCH', 'HEAD', 'OPTIONS'], (ctx) =>
            this.handle(ctx),
        );
    }

    /**
     * Build the GraphQL schema using TypeGraphQL and the provided resolvers
     * @returns {Promise<GraphQLSchema>} - The built GraphQL schema
     * @private
     */
    async #buildSchema(): Promise<GraphQLSchema> {
        const importedModules = await Promise.all(
            this.#resolvers.map((lazyImport) => lazyImport()),
        );

        const resolvers = importedModules
            .map((module) => module.default)
            .filter(Boolean) as Function[];

        if (resolvers.length === 0) {
            throw new Error(
                `No resolvers found for GraphQL schema. ` +
                `Make sure your resolver files exist and export a default class decorated with @Resolver(). ` +
                `Configured patterns: ${JSON.stringify(this.#config.resolverPatterns || [])}`,
            );
        }

        const { apollo, scalarsMap, ...buildSchemaOptions } = this.#config;

        return buildSchema({
            resolvers: resolvers as any,
            container: {
                get: (someClass) => {
                    return this.#container.make(someClass);
                },
            },

            scalarsMap: [...baseScalars!, ...(scalarsMap ?? []),],
            authChecker: authChecker,

            ...buildSchemaOptions,
        });
    }

    /**
     * Start the Apollo Server with the given schema and configuration
     * @param schema {GraphQLSchema} - The GraphQL schema to use
     * @private
     */
    async #startApollo(schema: GraphQLSchema) {
        const { apollo: { plugins, playground, ...apolloConfig } } = this.#config;

        const apollo = new ApolloServer({
            schema,
            plugins: [
                ...(plugins ?? []),
                ...(!playground ? [ApolloServerPluginLandingPageDisabled()] : []),
            ],
            ...apolloConfig,
        });


        this.#apollo = apollo;
        await apollo.start();

        this.#logger.info(`[${this.name}] Started GraphQL Apollo Server`);
    }

    /**
     * Start the WebSocket server for subscriptions if pubsub is configured
     * @param schema {GraphQLSchema} - The GraphQL schema to use
     * @param httpServer {Server} - The Node HTTP server instance
     * @private
     */
    async #startWebsocket(schema: GraphQLSchema, httpServer: Server) {
        // We do not start the websocket server if pubsub is not configured
        if (!this.#config.pubSub) return;

        const ws = new WebSocketServer({
            path: this.#config.path,
            server: httpServer,
        });

        useServer({ schema }, ws);
    }
}
