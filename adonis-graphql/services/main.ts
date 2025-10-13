import GraphQlLServersManager from '../src/servers_manager.js';

import type { LazyImport } from '../src/types.js';


// Use a WeakMap to store the manager instance privately for each GraphQLService instance
// This ensures encapsulation and prevents external access during hot-reloading
const managerStore = new WeakMap<GraphQLService, GraphQlLServersManager>();

class GraphQLService {
    /**
     * Set the GraphQL servers manager instance
     * @param manager {GraphQlLServersManager} - The GraphQL servers manager instance
     */
    public setManager(manager: GraphQlLServersManager) {
        managerStore.set(this, manager);
    }

    /**
     * Get the GraphQL servers manager instance
     * @returns {GraphQlLServersManager} - The GraphQL servers manager instance
     * @throws {Error} - If the manager is not initialized
    */
    public get manager() {
        const manager = managerStore.get(this);
        if (!manager) {
            throw new Error('GraphQL manager not initialized');
        }
        return manager;
    }

    /**
     * Create a proxy for a specific schema
     * @param schemaName {string} - The name of the schema
     */
    public createSchemaProxy(schemaName: string) {
        return {
            resolvers: (resolvers: LazyImport<Function>[]) => {
                return this.manager.resolvers(schemaName, resolvers);
            },
            getServer: () => {
                return this.manager.getServer(schemaName);
            }
        };
    }
}


const graphqlService = new GraphQLService();

export default new Proxy(graphqlService, {
    get(target, prop) {
        if (prop in target || typeof prop === 'symbol') {
            return target[prop as keyof GraphQLService];
        }

        const schemaName = String(prop);
        return target.createSchemaProxy(schemaName);
    }
});
