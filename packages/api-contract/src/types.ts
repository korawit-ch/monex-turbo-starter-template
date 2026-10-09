export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/**
 * Framework-agnostic description of an HTTP endpoint.
 *
 * TResponse is represented by a phantom field so fetch implementations can
 * infer their return type without coupling this package to a runtime client.
 */
export type ApiEndpoint<TResponse, TBody = never> = {
  url: string;
  method: ApiMethod;
  readonly _response?: TResponse;
} & ([TBody] extends [never] ? object : { body: TBody });

export type ApiEndpointWithBody<TBody, TResponse> = ApiEndpoint<
  TResponse,
  TBody
>;
