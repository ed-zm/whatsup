import type { IncomingMessage } from 'node:http';

export function extractTokenFromHandshake(request: IncomingMessage): string | null {
  const authorization = request.headers.authorization;
  const bearerToken = extractBearerToken(Array.isArray(authorization) ? authorization[0] : authorization);

  if (bearerToken) {
    return bearerToken;
  }

  const protocolHeader = request.headers['sec-websocket-protocol'];
  const protocols = Array.isArray(protocolHeader)
    ? protocolHeader.flatMap((value) => value.split(','))
    : protocolHeader?.split(',') ?? [];
  const tokenProtocol = protocols.map((value) => value.trim()).find((value) => value.startsWith('token.'));

  if (tokenProtocol) {
    return tokenProtocol.slice('token.'.length);
  }

  const url = new URL(request.url ?? '/', 'ws://localhost');

  return url.searchParams.get('access_token') ?? url.searchParams.get('token');
}

function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  return scheme === 'Bearer' && token ? token : null;
}
