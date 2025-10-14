/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "ConfigureCommand"
| instance and you can use codemods to modify the source files.
|
*/

import { stubsRoot } from './stubs/main.js';
import { readPackageJSON, writePackageJSON } from 'pkg-types';

import ConfigureCommand from '@adonisjs/core/commands/configure';


export async function configure(command: ConfigureCommand) {
    const codemods = await command.createCodemods();

    await codemods.updateRcFile((rcFile) => {
        rcFile.addProvider('@lithium-apps/adonis-graphql/graphql_provider');
        rcFile.addPreloadFile('#start/graphql');
    });

    await codemods.makeUsingStub(stubsRoot, 'config/graphql.stub', {});
    await codemods.makeUsingStub(stubsRoot, 'start/graphql.stub', {});
    await codemods.makeUsingStub(stubsRoot, 'resolvers/demo_resolver.stub', {});

    const shouldInstallPackages = await command.prompt.confirm(
        `Do you want to install additional packages required by "@lithium-apps/adonis-graphql" ?`,
        { name: 'shouldInstallPackages' },
    );

    if (shouldInstallPackages) {
        await codemods.installPackages([
            {
                name: 'graphql',
                isDevDependency: false,
            },
            {
                name: 'type-graphql',
                isDevDependency: false,
            },
            {
                name: 'graphql-scalars',
                isDevDependency: false,
            },
        ]);
    }

    await updatePackageJson(command);
}

async function updatePackageJson(command: ConfigureCommand) {
    const path = command.app.makePath('package.json');
    const packageJson = await readPackageJSON(path);

    packageJson.imports = {
        ...packageJson.imports,
        '#graphql/*': './app/graphql/*.js',
    };

    await writePackageJSON(path, packageJson);
    logSuccess(command);
}

function logSuccess(command: ConfigureCommand) {
    const name = command.colors.yellow('@lithium-apps/adonis-graphql');
    command.ui.sticker()
        .add(command.colors.bold(`Lithium Apps - ${name}`))
        .add(`Welcome to ${name} !`)
        .render()
}
