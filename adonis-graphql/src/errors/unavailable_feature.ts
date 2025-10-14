import { Exception } from '@adonisjs/core/exceptions';


export class UnavailableFeatureError extends Exception {
    static status = 500;
    static code = 'E_UNAVAILABLE_FEATURE_ERROR';

    constructor(public message: string, options?: ErrorOptions) {
        super(`Unavailable Feature Error: ${message}`, options);
    }
}
