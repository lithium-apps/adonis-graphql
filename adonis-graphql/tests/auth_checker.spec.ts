import { test } from '@japa/runner';
import { authChecker } from '../src/auth_checker.js';
import { UnavailableFeatureError } from '../src/errors/unavailable_feature.js';
import { Bouncer } from '@adonisjs/bouncer';
import { BouncerAbility } from '@adonisjs/bouncer/types';

const checker = authChecker as any;
test.group('AuthChecker', () => {
    test('throws an error if auth is not configured', async ({ assert }) => {
        await assert.rejects(() => checker({ context: {} }), UnavailableFeatureError);
    });

    test('returns false if not authenticated', async ({ assert }) => {
        const result = await checker({
            context: {
                auth: {
                    check: () => false,
                },
            },
        });
        assert.equal(result, false);
    });

    test('returns true if authenticated', async ({ assert }) => {
        const result = await checker({
            context: {
                auth: {
                    check: () => true,
                },
            },
        });
        assert.equal(result, true);
    });

    test('throws an error if abilities passed without bouncer available', async ({ assert }) => {
        await assert.rejects(
            () =>
                checker(
                    {
                        context: {
                            auth: {
                                check: () => true,
                            },
                        },
                    },
                    Bouncer.ability(() => false),
                ),
            UnavailableFeatureError,
        );
    });

    test('returns false if bouncer denies', async ({ assert }) => {
        const result = await checker(
            {
                context: {
                    auth: {
                        check: () => true,
                    },
                    bouncer: {
                        denies(ability: BouncerAbility<any>) {
                            return !ability.execute({});
                        },
                    },
                },
            },
            [Bouncer.ability(() => false)],
        );
        assert.equal(result, false);
    });

    test('returns true if bouncer allow', async ({ assert }) => {
        const result = await checker(
            {
                context: {
                    auth: {
                        check: () => true,
                    },
                    bouncer: {
                        denies(ability: BouncerAbility<any>) {
                            return !ability.execute({});
                        },
                    },
                },
            },
            [Bouncer.ability(() => true)],
        );
        assert.equal(result, true);
    });
});
