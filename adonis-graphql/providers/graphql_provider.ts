import type GraphQLServersManager from '../src/servers_manager.js';
import type { ApplicationService } from '@adonisjs/core/types';
import type { GraphQLConfig } from '../src/types.js';

declare module '@adonisjs/core/types' {
    export interface ContainerBindings {
        graphql: GraphQLServersManager;
    }
}

export default class GraphQlProvider {
    constructor(protected app: ApplicationService) {}

    register() {
        this.app.container.singleton('graphql', async (resolver) => {
            const logger = await this.app.container.make('logger');
            const appRoot = this.app.appRoot.toString();

            const config = this.app.config.get<GraphQLConfig>('graphql', null);
            if (!config) logger.error(`GraphQL config missing in ${this.app.configPath('graphql')}`);

            const { default: GraphQLServersManager } = await import('../src/servers_manager.js');
            const manager = new GraphQLServersManager(config, resolver, logger, appRoot.toString());
            await manager.initialize();

            return manager;
        });
    }

    async boot() {
        const graphql = await this.app.container.make('graphql');
        const router = await this.app.container.make('router');
        const { default: graphqlService } = await import('../services/main.js');

        graphql.registerRoutes(router);
        graphqlService.setManager(graphql);
    }

    async ready() {
        if (this.app.getEnvironment() === 'web') {
            const server = await this.app.container.make('server');
            const graphql = await this.app.container.make('graphql');
            const nodeServer = server.getNodeServer()!;

            await graphql.start(nodeServer);
        }
    }
}
