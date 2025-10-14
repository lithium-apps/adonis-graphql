import { DateTime } from 'luxon';
import { GraphQLScalarType, Kind } from 'graphql';

export const LuxonDateTimeScalar = new GraphQLScalarType({
    name: 'LuxonDateTime',
    description: 'Luxon Date scalar type',

    serialize(value: unknown): string {
        if (!DateTime.isDateTime(value)) {
            throw new Error('LuxonDateTimeScalar can only serialize DateTime values');
        }

        const iso = value.toISO();

        if (!iso) {
            throw new Error('LuxonDateTimeScalar must be a valid DateTime');
        }

        return iso;
    },

    parseValue(value: unknown): DateTime {
        if (typeof value !== 'string') {
            throw new Error('LuxonDateTimeScalar can only parse string values');
        }

        return DateTime.fromISO(value);
    },

    parseLiteral(ast): DateTime {
        if (ast.kind !== Kind.STRING) {
            throw new Error('LuxonDateTimeScalar can only parse string values');
        }

        return DateTime.fromISO(ast.value);
    },
});
