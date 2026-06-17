import { v4 as uuidv4 } from 'uuid';

/**
 * Attaches a unique UUID to every incoming request.
 * - Respects an existing `X-Request-Id` header
 * - Echoes the ID back in the response as `X-Request-Id`
 * - Attaches to `req.id` so log calls can correlate
 */
export function requestId(req, res, next) {
  const existing = req.headers['x-request-id'];
  const id = existing || uuidv4();

  req.id = id;
  res.setHeader('X-Request-Id', id);

  next();
}
