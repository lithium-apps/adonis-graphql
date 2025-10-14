import app from '@adonisjs/core/services/app';

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
    #resolvers: Map<string, LazyImport<Function>[]> = new Map();

    constructor(config: GraphQLConfig, container: ContainerResolver<ContainerBindings>, logger: Logger) {
        this.#config = config;
        this.#container = container;
        this.#logger = logger;
    }

    /**
     * Get a GraphQLServer instance by name
     * @param name {string} - The name of the schema
     * @returns {GraphQLServer} - The GraphQLServer instance
     * @throws {Error} - If the schema with the given name does not exist
     */
    public getServer(name: string): GraphQLServer {
        const server = this.#servers.get(name);
        if (!server) throw new Error(`Schema '${name}' not found`);

        return server;
    }

    /**
     * Initialize the server manager by loading config and their resolvers
     * from the configuration. This method should be called once during application startup.
     */
    public async initialize() {
        for (const [serverName, serverConfig] of Object.entries(this.#config)) {
            const server = new GraphQLServer(serverName, serverConfig, this.#container, this.#logger);
            this.#servers.set(serverName, server);

            console.log(this.#servers);

            // if (serverConfig.resolverPatterns) {
            //     await this.#loadResolversFromPatterns(serverName, serverConfig.resolverPatterns);
            // }
        }
    }

    /**
     * Load resolvers from file patterns and register them with the specified server
     * @param serverName {string} - The name of the server
     * @param patterns {string[]} - An array of glob patterns to load resolver files
     * @private
     */
    // @ts-ignore
    async #loadResolversFromPatterns(serverName: string, patterns: string[]) {
        const resolvers: LazyImport<Function>[] = [];
        const appRoot = app.appRoot.pathname;

        for (const pattern of patterns) {
            try {
                const files = await glob(pattern, { absolute: true, cwd: appRoot });

                for (const file of files) {
                    resolvers.push(() => import(pathToFileURL(file).href));
                }

                this.#logger.info(`[${serverName}] Loaded ${files.length} resolvers from ${pattern}`);
            }

            catch (error) {
                this.#logger.warn(`Failed to load resolvers from pattern '${pattern}':`, error);
            }
        }

        if (resolvers.length <= 0)
            return this.#logger.warn(`No resolvers found for schema '${serverName}' with patterns:`, patterns);

        return await this.resolvers(serverName, resolvers);
    }

    /**
     * Set the resolvers for a specific server
     * @param serverName {string} - The name of the server
     * @param resolvers {LazyImport<Function>[]} - An array of lazy imports for resolver classes
     */
    public async resolvers(serverName: string, resolvers: LazyImport<Function>[]) {
        const existingResolvers = this.#resolvers.get(serverName) || [];
        this.#resolvers.set(serverName, [...existingResolvers, ...resolvers]);

        const server = this.#servers.get(serverName);
        if (server) await server.setResolvers(this.#resolvers.get(serverName)!);
    }

    /**
     * Start all registered GraphQL Servers
     * @param server {Server} - The Node HTTP server instance.
     */
    public async start(server: Server) {
        for (const [, graphqlServer] of this.#servers) {
            await graphqlServer.start(server);
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
