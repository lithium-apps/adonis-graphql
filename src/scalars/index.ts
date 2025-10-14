import { DateTime } from 'luxon';

import { LuxonDateTimeScalar } from './luxon_datetime.js';

import type { BuildSchemaOptions } from 'type-graphql';


export const baseScalars: BuildSchemaOptions['scalarsMap'] = [
    { type: DateTime, scalar: LuxonDateTimeScalar }
];
