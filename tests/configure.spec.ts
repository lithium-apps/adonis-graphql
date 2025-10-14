import Configure from '@adonisjs/core/commands/configure';
import { IgnitorFactory } from '@adonisjs/core/factories';
import { test } from '@japa/runner';
import { fileURLToPath } from 'node:url';


test.group('Configure', () => {
    test('should configure openapi', async ({ fs, assert }) => {
        const ignitor = new IgnitorFactory()
            .withCoreProviders()
            .withCoreConfig()
            .create(fs.baseUrl, {
                importer: (filePath) => {
                    if (filePath.startsWith('./') || filePath.startsWith('../')) {
                        return import(new URL(filePath, fs.baseUrl).href);
                    }

                    return import(filePath);
                },
            });

        const app = ignitor.createApp('console');
        await app.init();
        await app.boot();

        await fs.create('.env', '');
        await fs.createJson('tsconfig.json', {});
        await fs.createJson('package.json', {});
        await fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`);
        await fs.create('adonisrc.ts', `export default defineConfig({})`);

        const ace = await app.container.make('ace');

        // Utiliser le chemin absolu du fichier index.js du projet
        const packagePath = fileURLToPath(new URL('../index.js', import.meta.url));
        const command = await ace.create(Configure, [packagePath]);

        command.prompt.trap('shouldInstallPackages').reject();

        await command.exec();

        command.assertSucceeded();

        await assert.fileExists('config/graphql.ts');
        await assert.fileContains('config/graphql.ts', 'defineConfig');

        await assert.fileContains('package.json', '#graphql');

        await assert.fileExists('adonisrc.ts');
        await assert.fileContains('adonisrc.ts', '@lithium-apps/adonis-graphql/graphql_provider');
    }).timeout(30000);
});
