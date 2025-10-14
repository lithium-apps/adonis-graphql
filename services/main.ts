import app from '@adonisjs/core/services/app'

import type { GraphQLService } from '../src/types.js';


let graphql: GraphQLService;

await app.booted(async () => {
   graphql = await app.container.make('graphql') as any
})

export { graphql as default }
