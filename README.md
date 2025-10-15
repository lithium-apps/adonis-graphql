<a name="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]
[![GitHub Build][github-build]][github-build-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/lithium-apps/adonis-graphql">
    <img src="https://github.com/lithium-apps/edge/blob/main/.github/assets/lithium_logo.png?raw=true" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">@lithium-apps/adonis-graphql</h3>

  <p align="center">
    Create powerful GraphQL APIs with your AdonisJS Application
    <br />
    <br />
    <a href="https://github.com/lithium-apps/adonis-graphql/issues/new?labels=enhancement">Request Feature</a>
    ·
    <a href="https://github.com/lithium-apps/adonis-graphql/issues/new?labels=bug">Report Bug</a>
    ·
    <a href="https://github.com/lithium-apps/adonis-graphql/issues/new?labels=enhancement">Request Modification</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#installation">Installation</a>
    </li>
    <li>
      <a href="#configuration">Configuration</a>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#single-schema">Single Schema</a></li>
        <li><a href="#multiple-schemas">Multiple Schemas</a></li>
        <li><a href="#creating-resolvers">Creating Resolvers</a></li>
        <li><a href="#authentication--authorization">Authentication & Authorization</a></li>
        <li><a href="#validation">Validation</a></li>
        <li><a href="#scalars">Custom Scalars</a></li>
      </ul>
    </li>
    <li><a href="#features">Features</a></li>
    <li><a href="#advanced-configuration">Advanced Configuration</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About the project

This package provides a seamless integration of GraphQL into your AdonisJS application using Apollo Server and TypeGraphQL. It supports multiple GraphQL schemas with separate endpoints, making it perfect for scenarios like separating public and admin APIs, or versioning your GraphQL endpoints.

**Key Features:**
- 🚀 Easy integration with AdonisJS 6+
- 🔄 Support for multiple GraphQL schemas with different endpoints
- 🎯 Type-safe with TypeScript and TypeGraphQL
- 🔐 Built-in authentication and authorization with AdonisJS Auth and Bouncer
- 🎮 GraphQL Playground support for development
- 📡 WebSocket support for real-time subscriptions
- 🔧 Auto-loading resolvers with glob patterns
- 📝 Built-in validation with VineJS integration
- 🕒 Custom scalars (LuxonDateTime included)
- 🎨 Flexible Apollo Server configuration per schema

We welcome contributions and improvements to this module. Don't hesitate to submit features and improvements ;)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

-   [![TypeScript][TypeScript]][TypeScript-url]
-   [![Apollo][Apollo]][Apollo-url]
-   [![GraphQL][GraphQL]][GraphQL-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- INSTALLATION -->

## Installation

For now the package isn't published to npm, but you can install it from the GitHub registry and can be installed in any project.

1.  You need to create a `.npmrc` file at the root of your project with the following content:

    ```sh
    @lithium-apps:registry=https://npm.pkg.github.com
    ```

2.  For the login process you need to set a personal access token with the `read:packages` scope.
    Then you can login to the GitHub registry with the following command:
    ```sh
    pnpm login --registry=https://npm.pkg.github.com --scope=@lithium-apps
    ```

3. Install the package using the following command:
    ```sh
    pnpm install @lithium-apps/adonis-graphql
    ```

4. Configure the package:
    ```sh
    node ace configure @lithium-apps/adonis-graphql
    ```

This will:
- Add the GraphQL provider to your `adonisrc.ts`
- Create a `config/graphql.ts` configuration file
- Create a `start/graphql.ts` file for registering resolvers
- Create a demo resolver in `app/graphql/resolvers/demo_resolver.ts`
- Install required dependencies (graphql, type-graphql, graphql-scalars)
- Add the `#graphql/*` import alias to your `package.json`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONFIGURATION -->

## Configuration

After installation, the package creates a configuration file at `config/graphql.ts`:

```typescript
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@lithium-apps/adonis-graphql'

export default defineConfig({
  main: {
    path: '/graphql',
    apollo: {
      introspection: !app.inProduction,
      playground: !app.inProduction,
    },
    emitSchemaFile: true,
  }
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE -->

## Usage

### Single Schema

For a single GraphQL API, use the default configuration:

1. **Create a resolver:**

```typescript
// app/graphql/resolvers/user_resolver.ts
import { Resolver, Query, Arg } from '@lithium-apps/adonis-graphql'

@Resolver()
export default class UserResolver {
  @Query(() => String)
  hello(@Arg('name') name: string): string {
    return `Hello ${name}!`
  }
}
```

2. **Register the resolver in `start/graphql.ts`:**

```typescript
import graphql from '@lithium-apps/adonis-graphql/services/main'

graphql.use('main').resolvers([
  () => import('#graphql/resolvers/demo_resolver'),
  () => import('#graphql/resolvers/user_resolver'),
])
```

### Multiple Schemas

For multiple GraphQL APIs (e.g., public and admin), update your configuration:

1. **Update `config/graphql.ts`:**

```typescript
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@lithium-apps/adonis-graphql'

export default defineConfig({
  public: {
    path: '/graphql',
    apollo: {
      introspection: !app.inProduction,
      playground: !app.inProduction,
    },
    emitSchemaFile: true,
    // Auto-load resolvers matching this pattern
    resolverPatterns: [
      './app/graphql/public/*_resolver.js'
    ]
  },
  admin: {
    path: '/admin/graphql',
    apollo: {
      introspection: !app.inProduction,
      playground: !app.inProduction,
    },
    emitSchemaFile: true,
    resolverPatterns: [
      './app/graphql/admin/*_resolver.js'
    ]
  }
})
```

2. **Register resolvers for each schema:**

```typescript
// start/graphql.ts
import graphql from '@lithium-apps/adonis-graphql/services/main'

// Public API resolvers
await graphql.use('public').resolvers([
  () => import('#graphql/public/user_resolver'),
  () => import('#graphql/public/post_resolver'),
])

// Admin API resolvers  
await graphql.use('admin').resolvers([
  () => import('#graphql/admin/admin_resolver'),
  () => import('#graphql/admin/analytics_resolver'),
])
```

### Creating Resolvers

**Basic resolver:**

```typescript
import { Resolver, Query, Mutation, Arg } from 'type-graphql'

@Resolver()
export default class UserResolver {
  @Query(() => String)
  hello(@Arg('name') name: string): string {
    return `Hello ${name}!`
  }

  @Mutation(() => Boolean)
  createUser(@Arg('email') email: string): boolean {
    // Your logic here
    return true
  }
}
```

**With HttpContext:**

```typescript
import { Resolver, Query, Ctx } from 'type-graphql'
import type { HttpContext } from '@adonisjs/core/http'

@Resolver()
export default class UserResolver {
  @Query(() => String)
  async currentUser(@Ctx() ctx: HttpContext): Promise<string> {
    await ctx.auth.check()
    return ctx.auth.user?.email || 'Guest'
  }
}
```

### Authentication & Authorization

**Using the CurrentUser decorator:**

```typescript
import { Resolver, Query } from 'type-graphql'
import { CurrentUser } from '@lithium-apps/adonis-graphql'

@Resolver()
export default class UserResolver {
  @Query(() => String)
  profile(@CurrentUser() user: any): string {
    return `Welcome ${user.email}!`
  }
}
```

**Using authorization with Bouncer:**

```typescript
import { Resolver, Query, Authorized } from 'type-graphql'

@Resolver()
export default class AdminResolver {
  @Authorized(['viewAdminPanel']) // Bouncer ability name
  @Query(() => String)
  adminData(): string {
    return 'Secret admin data'
  }

  @Authorized() // Just requires authentication
  @Query(() => String)
  protectedData(): string {
    return 'Protected data'
  }
}
```

### Validation

**Using VineJS validation:**

```typescript
import { Resolver, Mutation, Arg } from 'type-graphql'
import { validateArgs } from '@lithium-apps/adonis-graphql/decorators/vine/main'
import vine from '@vinejs/vine'

const createUserSchema = vine.compile(
  vine.object({
    email: vine.string().email(),
    name: vine.string().minLength(2),
  })
)

@Resolver()
export default class UserResolver {
  @validateArgs(createUserSchema)
  @Mutation(() => Boolean)
  createUser(
    @Arg('email') email: string,
    @Arg('name') name: string
  ): boolean {
    // Arguments are automatically validated
    return true
  }
}
```

### Scalars

**Using built-in LuxonDateTime scalar:**

```typescript
import { Resolver, Query, Field, ObjectType } from 'type-graphql'
import { DateTime } from 'luxon'

@ObjectType()
class Post {
  @Field()
  title: string

  @Field(() => DateTime)
  createdAt: DateTime
}

@Resolver()
export default class PostResolver {
  @Query(() => Post)
  latestPost(): Post {
    return {
      title: 'Latest Post',
      createdAt: DateTime.now()
    }
  }
}
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FEATURES -->

## Features

- ✅ **Multiple GraphQL Schemas**: Create separate APIs for different purposes (public, admin, etc.)
- ✅ **Automatic Endpoint Creation**: All configured schemas are automatically instantiated and started
- ✅ **Type-Safe**: Full TypeScript support with TypeGraphQL decorators
- ✅ **Authentication & Authorization**: Built-in support for AdonisJS Auth and Bouncer
- ✅ **GraphQL Playground**: Interactive API explorer for development
- ✅ **Auto-Loading**: Load resolvers automatically using glob patterns
- ✅ **WebSocket Support**: Real-time subscriptions with GraphQL subscriptions
- ✅ **Single HTTP Server**: All schemas share the same HTTP server
- ✅ **Flexible Configuration**: Independent Apollo Server configuration per schema
- ✅ **VineJS Integration**: Built-in validation decorators for arguments
- ✅ **Custom Scalars**: Includes LuxonDateTime scalar, easily extensible
- ✅ **Container Integration**: Full dependency injection support
- ✅ **Error Handling**: Comprehensive error handling with custom error types

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ADVANCED CONFIGURATION -->

## Advanced Configuration

**Custom scalars configuration:**

```typescript
import { defineConfig } from '@lithium-apps/adonis-graphql'
import { DateTimeScalar } from 'graphql-scalars'

export default defineConfig({
  main: {
    path: '/graphql',
    apollo: {
      introspection: true,
      playground: true,
    },
    scalarsMap: [
      { type: Date, scalar: DateTimeScalar },
    ],
    emitSchemaFile: true,
  }
})
```

**WebSocket subscriptions:**

```typescript
import { defineConfig } from '@lithium-apps/adonis-graphql'
import { RedisPubSub } from 'graphql-redis-subscriptions'

export default defineConfig({
  main: {
    path: '/graphql',
    apollo: {
      introspection: true,
      playground: true,
    },
    // Enable subscriptions by providing a PubSub instance
    pubSub: new RedisPubSub({
      connection: {
        host: '127.0.0.1',
        port: 6379,
      }
    }),
    emitSchemaFile: true,
  }
})
```

**Resolver patterns for auto-loading:**

```typescript
import { defineConfig } from '@lithium-apps/adonis-graphql'

export default defineConfig({
  api: {
    path: '/api/graphql',
    resolverPatterns: [
      './app/graphql/api/**/*_resolver.js',
      './app/graphql/shared/*_resolver.js'
    ],
    apollo: {
      introspection: true,
      playground: true,
    },
    emitSchemaFile: true,
  }
})
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

-   Kylian Mallet - [@Kylian-Mallet](https://github.com/Kylian-Mallet) - [kylian.mallet@sklav.group](mailto:kylian.mallet@sklav.group)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/lithium-apps/adonis-graphql.svg?style=for-the-badge
[contributors-url]: https://github.com/lithium-apps/adonis-graphql/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/lithium-apps/adonis-graphql.svg?style=for-the-badge
[forks-url]: https://github.com/lithium-apps/adonis-graphql/network/members
[stars-shield]: https://img.shields.io/github/stars/lithium-apps/adonis-graphql.svg?style=for-the-badge
[stars-url]: https://github.com/lithium-apps/adonis-graphql/stargazers
[issues-shield]: https://img.shields.io/github/issues/lithium-apps/adonis-graphql.svg?style=for-the-badge
[issues-url]: https://github.com/lithium-apps/adonis-graphql/issues
[license-shield]: https://img.shields.io/github/license/lithium-apps/adonis-graphql.svg?style=for-the-badge
[license-url]: https://github.com/lithium-apps/adonis-graphql/blob/main/LICENSE.md
[github-build]: https://img.shields.io/github/actions/workflow/status/lithium-apps/adonis-graphql/brp-package.yml?branch=main&style=for-the-badge
[github-build-url]: https://github.com/lithium-apps/adonis-graphql/actions/workflows/brp-package.yml

[TypeScript]: https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Apollo]: https://img.shields.io/badge/Apollo-311C87?style=for-the-badge&logo=apollographql&logoColor=white
[Apollo-url]: https://www.apollographql.com/
[GraphQL]: https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white
[GraphQL-url]: https://graphql.org/
