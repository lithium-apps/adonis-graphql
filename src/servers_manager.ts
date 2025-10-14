import { glob } from 'glob';
import { pathToFileURL } from 'node:url';
import { Logger } from '@adonisjs/core/logger';
import { ContainerResolver } from '@adonisjs/core/container';

import GraphQLServer from './graphql_server.js';

import type { Server } from 'node:http';
import type { GraphQLConfig, LazyImport } from './types.js';
import type { ContainerBindings, HttpRouterService } from '@adonisjs/core/types';


export default class GraphQLServersManager {
    #servers: Map<string, GraphQLServer> = new Map();
    #config: GraphQLConfig;
    #container: ContainerResolver<ContainerBindings>;
    #logger: Logger;
    #appRoot: string;

    constructor(config: GraphQLConfig, container: ContainerResolver<ContainerBindings>, logger: Logger, appRoot: string) {
        this.#config = config;
        this.#container = container;
        this.#logger = logger;
        this.#appRoot = appRoot;
    }

    /**
     * Get a GraphQLServer instance by name
     * @param name {string} - The name of the server from the config
     * @returns {GraphQLServer} - The GraphQLServer instance
     * @throws {Error} - If the schema with the given name does not exist
     */
    public use(name: string): GraphQLServer {
        const server = this.#servers.get(name);
        if (!server) throw new Error(`GraphQL Server '${name}' not found.`);
        return server;
    }

    /**
     * Initialize the server manager by loading config and their resolvers
     * from the configuration. This method should be called once during application startup.
     * @private
     */
    public async initialize() {
        this.#logger.info(`[adonis-graphql] Initializing GraphQL Servers`);

        for (const [serverName, serverConfig] of Object.entries(this.#config)) {
            const server = new GraphQLServer(serverName, serverConfig, this.#container, this.#logger);
            this.#servers.set(serverName, server);

            if (serverConfig.resolverPatterns) {
                await this.#loadResolversFromPatterns(server, serverConfig.resolverPatterns);
            }
        }
    }

    /**
     * Load resolvers from file patterns and register them with the specified server
     * @param server {GraphQLServer} - The graphql server instance
     * @param patterns {string[]} - An array of glob patterns to load resolver files
     * @private
     */
    async #loadResolversFromPatterns(server: GraphQLServer, patterns: string[]) {
        const foundResolvers: LazyImport<Function>[] = [];

        for (const pattern of patterns) {
            try {
                const files = await glob(pattern, { absolute: true, cwd: this.#appRoot });

                for (const file of files) {
                    foundResolvers.push(() => import(pathToFileURL(file).href));
                }

                this.#logger.info(`[adonis-graphql:${server.name}] Loaded ${files.length} resolvers from ${pattern}`);
            }

            catch (error) {
                this.#logger.error(`[adonis-graphql:${server.name}] Failed to load resolvers from pattern '${pattern}'`);
            }
        }

        if (foundResolvers.length <= 0) {
            this.#logger.warn(`[adonis-graphql:${server.name}] No resolvers found for server '${server.name}'`);
            return;
        }

        return server.resolvers(foundResolvers);
    }

    /**
     * Start all registered GraphQL Servers
     * @param httpServer {Server} - The Node HTTP server instance.
     */
    public async start(httpServer: Server) {
        for (const [, graphqlServer] of this.#servers) {
            await graphqlServer.start(httpServer);
        }
    }

    /**
     * Register routes for all GraphQL Servers with the given HTTP router.
     * @param router {HttpRouterService} - The Adonis router instance to register the routes with
     */
    public registerRoutes(router: HttpRouterService) {
        for (const [, graphqlServer] of this.#servers) {
            graphqlServer.registerRoute(router);
        }
    }
}
