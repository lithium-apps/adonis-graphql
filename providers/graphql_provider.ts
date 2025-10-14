import type GraphQLServersManager from '../src/servers_manager.js';
import type { ApplicationService } from '@adonisjs/core/types';
import type { GraphQLConfig } from '../src/types.js';

declare module '@adonisjs/core/types' {
    export interface ContainerBindings {
        // @ts-ignore
        graphql: GraphQLServersManager;
    }
}

export default class GraphQlProvider {
    constructor(protected app: ApplicationService) {}

    register() {
        console.log('Registering GraphQL provider');
        this.app.container.singleton('graphql', async (resolver) => {
            const { default: GraphQLServersManager } = await import('../src/servers_manager.js');

            const logger = await this.app.container.make('logger');
            const config = this.app.config.get<GraphQLConfig>('graphql', null);

            if (!config) logger.error(`GraphQL config missing in ${this.app.configPath('graphql')}`);

            const manager = new GraphQLServersManager(config, resolver, logger);
            await manager.initialize();

            return manager;
        });
    }

    async boot() {
        const graphql = await this.app.container.make('graphql');
        const router = await this.app.container.make('router');

        graphql.registerRoutes(router);
    }

    async ready() {
        if (this.app.getEnvironment() === 'web') {
            const server = await this.app.container.make('server');
            const graphql = await this.app.container.make('graphql');

            await graphql.start(server.getNodeServer()!);
        }
    }
}
