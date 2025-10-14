import app from '@adonisjs/core/services/app'

import type GraphQLServersManager from '../src/servers_manager.js';

let graphql: GraphQLServersManager

await app.booted(async () => {
   graphql = await app.container.make('graphql') as any
})

export { graphql as default }


// Use a WeakMap to store the manager instance privately for each GraphQLService instance
// This ensures encapsulation and prevents external access during hot-reloading
// const managerStore = new WeakMap<GraphQLService, GraphQlLServersManager>();
//
// class GraphQLService {
//     /**
//      * Set the GraphQL servers manager instance
//      * @param manager {GraphQlLServersManager} - The GraphQL servers manager instance
//      */
//     public setManager(manager: GraphQlLServersManager) {
//         managerStore.set(this, manager);
//     }
//
//     /**
//      * Get the GraphQL servers manager instance
//      * @returns {GraphQlLServersManager} - The GraphQL servers manager instance
//      * @throws {Error} - If the manager is not initialized
//      */
//     public get manager() {
//         const manager = managerStore.get(this);
//         if (!manager) {
//             throw new Error('GraphQL manager not initialized');
//         }
//         return manager;
//     }
//
//     /**
//      * Create a proxy for a specific schema
//      * @param schemaName {string} - The name of the schema
//      */
//     public createSchemaProxy(schemaName: string) {
//         return {
//             resolvers: (resolvers: LazyImport<Function>[]) => {
//                 return this.manager.resolvers(schemaName, resolvers);
//             },
//             getServer: () => {
//                 return this.manager.getServer(schemaName);
//             },
//         };
//     }
// }
//
// let graphql: GraphQLService;
// await app.booted(async () => {
//     const service = new GraphQLService();
//     const manager = await app.container.make('graphql');
//     service.setManager(manager);
//
//     graphql = new Proxy(service, {
//         get(target, prop) {
//             if (prop in target || typeof prop === 'symbol') {
//                 return target[prop as keyof GraphQLService];
//             }
//
//             const schemaName = String(prop);
//             return target.createSchemaProxy(schemaName);
//         },
//     });
// });
