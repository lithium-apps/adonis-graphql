import { HeaderMap } from '@apollo/server';
import { Request, Response } from '@adonisjs/core/http';

import type { HTTPGraphQLRequest, HTTPGraphQLResponse } from '@apollo/server';


/**
 * Convert an AdonisJS Request to an Apollo HTTPGraphQLRequest
 * @param request {Request} - The AdonisJS request
 * @returns {HTTPGraphQLRequest} - The converted Apollo HTTPGraphQLRequest
 */
export function adonisToGraphqlRequest(request: Request): HTTPGraphQLRequest {
    const body = request.body();
    const headers = new HeaderMap();

    for (const [key, value] of Object.entries(request.headers())) {
        if (value !== undefined) {
            headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
    }

    return {
        method: request.method().toUpperCase(),
        headers,
        search: request.parsedUrl.search ?? '',
        body,
    };
}

/**
 * Convert an Apollo HTTPGraphQLResponse to an AdonisJS Response
 * @param response {Response} - The AdonisJS response object
 * @param httpGraphqlResponse {HTTPGraphQLResponse} - The Apollo HTTPGraphQLResponse
 */
export function graphqlToAdonisResponse(response: Response, httpGraphqlResponse: HTTPGraphQLResponse): void {
    for (const [key, value] of httpGraphqlResponse.headers) {
        response.header(key, value);
    }

    response.status(httpGraphqlResponse.status || 200);

    if (httpGraphqlResponse.body.kind === 'complete') {
        return response.send(httpGraphqlResponse.body.string);
    }

    throw new Error('Buffering not yet supported');
}
