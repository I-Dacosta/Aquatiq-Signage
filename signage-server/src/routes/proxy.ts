import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { getBxSession } from '../lib/bx-session';

const router = Router();

// Fetch BX data from BX API with authentication
async function fetchBXData() {
  try {
    // Get server-side BxSoftware session
    const bxSid = await getBxSession();
    
    if (!bxSid) {
      console.error('Failed to get BxSoftware session');
      return null;
    }

    const response = await fetch('https://bxwm.bxsoftware.no/api/22205/1.0/receivelist?limit=10000', {
      headers: {
        'Cookie': `BxSID=${bxSid}`,
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; SignageServer/1.0)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // 404 means no data available - return empty array
        console.log('ℹ️  No receiving data available (404)');
        return [];
      }
      console.error('BX API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('✅ BX data fetched successfully:', (data as any).totalcount || 0, 'items');
    return (data as any).data || data;
  } catch (error) {
    console.error('Error fetching BX data:', error);
    return null;
  }
}

export default function setupProxyRoutes(pool: Pool) {
  
  // API endpoint to get BX data (for frontend)
  router.get('/bx-data', async (req: Request, res: Response) => {
    try {
      const data = await fetchBXData();
      if (!data) {
        return res.status(500).json({ error: 'Failed to fetch BX data' });
      }
      
      // Calculate stats
      let totalLines = 0;
      let totalItems = 0;
      
      if (Array.isArray(data)) {
        data.forEach((list: any) => {
          totalLines += list.lines?.length || 0;
          if (Array.isArray(list.lines)) {
            list.lines.forEach((line: any) => totalItems += line.quantity || 0);
          }
        });
      }
      
      res.json({
        lists: Array.isArray(data) ? data.length : 0,
        lines: totalLines,
        items: totalItems,
        updated: new Date().toISOString(),
        data: data
      });
    } catch (error) {
      console.error('Error processing BX data:', error);
      res.status(500).json({ error: 'Failed to process BX data' });
    }
  });
  
  // Pure HTML/CSS Dashboard for TV/MagicINFO (NO JavaScript)
  router.get('/logistic-dashboard-embed', async (req: Request, res: Response) => {
    try {
      const orientation = req.query.orientation || 'landscape';
      const layout = req.query.layout || (orientation === 'portrait' ? 'vertical' : 'horizontal');
      const refresh = parseInt(req.query.refresh as string) || 30; // Refresh interval in seconds
      
      // Fetch BX data on server-side
      const data = await fetchBXData();
      
      let totalLists = 0;
      let totalLines = 0;
      let totalItems = 0;
      let errorMessage = '';
      
      if (data && Array.isArray(data)) {
        totalLists = data.length;
        data.forEach((list: any) => {
          totalLines += list.lines?.length || 0;
          list.lines?.forEach((line: any) => totalItems += line.quantity || 0);
        });
      } else {
        errorMessage = 'Unable to load data';
      }
      
      const currentTime = new Date().toLocaleTimeString('no-NO', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="${refresh}">
    <title>Logistics Monitor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #FAFAFA; 
            height: 100vh; 
            width: 100vw; 
            padding: 1rem; 
            overflow: hidden; 
        }
        .container { 
            max-width: 100%; 
            width: 100%; 
            height: 100%; 
            display: flex; 
            flex-direction: column; 
            gap: 0.5rem; 
        }
        h1 { font-size: 1.5rem; font-weight: 700; color: #18181B; }
        .subtitle { color: #1F2937; font-size: 0.75rem; margin: 0.15rem 0 0.5rem 0; }
        .section-title { font-size: 0.9rem; font-weight: 600; color: #18181B; margin: 0 0 0.3rem 0; }
        .stats-grid { 
            display: grid; 
            ${layout === 'vertical' ? 'grid-template-columns: 1fr;' : 'grid-template-columns: repeat(4, 1fr);'} 
            gap: 0.5rem; 
        }
        .card { 
            padding: 0.6rem 0.5rem; 
            border-radius: 0.5rem; 
            box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.1); 
            text-align: center; 
            color: white; 
        }
        .card-green { background: #56B05A; }
        .card-blue { background: #151F6D; }
        .card-orange { background: #F6A46E; }
        .card-purple { background: #4E60AD; }
        .card-value { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.15rem; }
        .card-label { font-size: 0.65rem; opacity: 0.95; }
        .error { text-align: center; padding: 2rem; color: #DC2626; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div>
            <h1>📦 Logistics Monitor</h1>
            <p class="subtitle">Real-time warehouse operations</p>
        </div>
        ${errorMessage ? `<div class="error">${errorMessage}</div>` : `
        <div>
            <div class="section-title">Active Receiving</div>
            <div class="stats-grid">
                <div class="card card-green">
                    <div class="card-value">${totalLists}</div>
                    <div class="card-label">Lists</div>
                </div>
                <div class="card card-blue">
                    <div class="card-value">${totalLines}</div>
                    <div class="card-label">Lines</div>
                </div>
                <div class="card card-orange">
                    <div class="card-value">${totalItems}</div>
                    <div class="card-label">Items</div>
                </div>
                <div class="card card-purple">
                    <div class="card-value">${currentTime}</div>
                    <div class="card-label">Updated</div>
                </div>
            </div>
        </div>
        `}
    </div>
</body>
</html>`;

      res.set({ 
        'Content-Type': 'text/html', 
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.send(html);

    } catch (error) {
      console.error('Error generating dashboard:', error);
      res.status(500).send('Error loading dashboard');
    }
  });

  return router;
}
