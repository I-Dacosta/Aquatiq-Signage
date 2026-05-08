import { Express, Request, Response } from 'express';

/**
 * Auth service compatibility route
 * Provides session information for clients calling /get-session endpoint.
 * 
 * This endpoint is called by the tools auth service as a fallback
 * when validating bearer tokens. Since the signage service is
 * public and doesn't require authentication, we return a minimal
 * but valid session response.
 */
export function setupAuthRoutes(app: Express) {
  // GET /get-session - Return minimal session info for bearer token validation
  // Called by: tools auth service during fallback validation
  // Response: Session object compatible with auth service expectations
  app.get('/get-session', (req: Request, res: Response) => {
    // Extract bearer token from Authorization header if present
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    // Signage service is public and doesn't validate tokens
    // Return a success response to indicate the endpoint exists
    res.json({
      session: {
        user: null, // No specific user on public signage service
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h from now
      },
      valid: true,
      message: 'Signage service session endpoint - public access'
    });
  });

  // POST /get-session - Same response for POST requests
  // Some clients may POST instead of GET
  app.post('/get-session', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    res.json({
      session: {
        user: null,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      valid: true,
      message: 'Signage service session endpoint - public access'
    });
  });

  // API path variant: /api/auth/get-session
  // Some clients may expect this path format
  app.get('/api/auth/get-session', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    res.json({
      session: {
        user: null,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      valid: true,
      message: 'Signage service session endpoint - public access'
    });
  });

  app.post('/api/auth/get-session', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    res.json({
      session: {
        user: null,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      valid: true,
      message: 'Signage service session endpoint - public access'
    });
  });
}
