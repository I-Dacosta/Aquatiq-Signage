import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

// Videos directory
const VIDEOS_DIR = process.env.VIDEOS_DIR || '/app/videos';

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  console.log(`📁 Created videos directory: ${VIDEOS_DIR}`);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEOS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.VIDEO_MAX_FILE_SIZE || '524288000'), // Default 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(mp4|webm|mov|avi|mkv)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Helper function to get base URL
function getBaseUrl(req: Request): string {
  if (process.env.VIDEO_BASE_URL) {
    return process.env.VIDEO_BASE_URL;
  }
  const protocol = req.protocol || 'http';
  const host = req.get('host');
  return host ? `${protocol}://${host}` : 'http://localhost:3002';
}

export default function setupVideoRoutes(pool: Pool) {
  // Upload video file
  router.post('/upload', upload.single('video'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
      }

      const { title, description } = req.body;
      const videoId = uuidv4();
      const filename = req.file.filename;
      const originalName = req.file.originalname;
      const fileSize = req.file.size;
      const mimeType = req.file.mimetype;

      await pool.query(
        `INSERT INTO videos (id, title, description, filename, original_name, file_size, mime_type, upload_date, view_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 0)`,
        [videoId, title || 'Untitled Video', description || '', filename, originalName, fileSize, mimeType]
      );

      res.json({
        success: true,
        video: {
          id: videoId,
          title: title || 'Untitled Video',
          description: description || '',
          filename: filename,
          originalName: originalName,
          size: fileSize,
          mimeType: mimeType,
          embedUrl: `${getBaseUrl(req)}/api/videos/embed/${videoId}`
        }
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload video' });
    }
  });

  // Add SharePoint URL
  router.post('/sharepoint', async (req: Request, res: Response) => {
    try {
      const { url, title, description } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'SharePoint URL is required' });
      }

      const videoId = uuidv4();

      await pool.query(
        `INSERT INTO videos (id, title, description, sharepoint_url, upload_date, view_count, file_size, mime_type, filename, original_name)
         VALUES ($1, $2, $3, $4, NOW(), 0, 0, 'video/sharepoint', '', '')`,
        [videoId, title || 'SharePoint Video', description || '', url]
      );

      res.json({
        success: true,
        video: {
          id: videoId,
          title: title || 'SharePoint Video',
          description: description || '',
          sharepointUrl: url,
          embedUrl: `${getBaseUrl(req)}/api/videos/embed/${videoId}`
        }
      });

    } catch (error) {
      console.error('SharePoint URL error:', error);
      res.status(500).json({ error: 'Failed to save SharePoint URL' });
    }
  });

  // List videos
  router.get('/', async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, title, description, filename, sharepoint_url, file_size, mime_type, upload_date, view_count
         FROM videos ORDER BY upload_date DESC`
      );

      const videos = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        filename: row.filename,
        sharepointUrl: row.sharepoint_url,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        uploadDate: row.upload_date,
        viewCount: row.view_count,
        embedUrl: `${getBaseUrl(req)}/api/videos/embed/${row.id}`,
        videoUrl: row.filename ? `${getBaseUrl(req)}/videos/${row.filename}` : null
      }));

      res.json({ videos });
    } catch (error) {
      console.error('List videos error:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  // Get video embed HTML
  router.get('/embed/:id', async (req: Request, res: Response) => {
    const videoId = req.params.id;

    try {
      const result = await pool.query('SELECT * FROM videos WHERE id = $1', [videoId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      const row = result.rows[0];
      const videoMetadata = {
        id: row.id,
        title: row.title,
        description: row.description,
        filename: row.filename,
        sharepointUrl: row.sharepoint_url,
        type: row.mime_type
      };

      // Increment view count
      await pool.query('UPDATE videos SET view_count = view_count + 1 WHERE id = $1', [videoId]);

      const title = videoMetadata.title || `Video ${videoId}`;
      let videoUrl;

      if (videoMetadata.filename) {
        videoUrl = `${getBaseUrl(req)}/videos/${videoMetadata.filename}`;
      } else if (videoMetadata.sharepointUrl) {
        videoUrl = videoMetadata.sharepointUrl;
      } else {
        return res.status(404).json({ error: 'No video source found' });
      }

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 100vw; height: 100vh; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        video { width: 100%; height: 100%; object-fit: cover; background: #000; pointer-events: none; }
        video::-webkit-media-controls { display: none !important; }
    </style>
</head>
<body>
    <video autoplay muted loop preload="auto" playsinline>
        <source src="${videoUrl}" type="video/mp4">
        Your browser does not support the video tag.
    </video>
    <script>
        const video = document.querySelector("video");
        video.addEventListener("loadeddata", () => video.play().catch(console.log));
        video.addEventListener("ended", () => { video.currentTime = 0; video.play().catch(console.log); });
        video.addEventListener("error", () => setTimeout(() => video.load(), 5000));
        video.addEventListener("pause", () => setTimeout(() => video.paused && video.play().catch(console.log), 100));
        document.addEventListener("visibilitychange", () => !document.hidden && video.paused && video.play().catch(console.log));
        window.addEventListener("load", () => video.play().catch(console.log));
    </script>
</body>
</html>`;

      res.set({ 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600' });
      res.send(html);

    } catch (error) {
      console.error('Error generating embed:', error);
      res.status(500).json({ error: 'Failed to generate embed' });
    }
  });

  // Update video
  router.put('/:id', async (req: Request, res: Response) => {
    const videoId = req.params.id;
    const { title, description } = req.body;

    if (!title && !description) {
      return res.status(400).json({ error: 'Title or description is required' });
    }

    try {
      const checkResult = await pool.query('SELECT id FROM videos WHERE id = $1', [videoId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Video not found' });
      }

      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (title) {
        updates.push(`title = $${paramIndex}`);
        values.push(title);
        paramIndex++;
      }

      if (description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(description);
        paramIndex++;
      }

      values.push(videoId);

      const updateQuery = `UPDATE videos SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const result = await pool.query(updateQuery, values);

      const updatedVideo = result.rows[0];

      res.json({
        success: true,
        video: {
          id: updatedVideo.id,
          title: updatedVideo.title,
          description: updatedVideo.description,
          embedUrl: `${getBaseUrl(req)}/api/videos/embed/${updatedVideo.id}`
        }
      });

    } catch (error) {
      console.error('Update video error:', error);
      res.status(500).json({ error: 'Failed to update video' });
    }
  });

  // Delete video
  router.delete('/:id', async (req: Request, res: Response) => {
    const videoId = req.params.id;

    try {
      const result = await pool.query('SELECT filename FROM videos WHERE id = $1', [videoId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Video not found' });
      }

      const filename = result.rows[0].filename;

      await pool.query('DELETE FROM videos WHERE id = $1', [videoId]);

      if (filename) {
        const filePath = path.join(VIDEOS_DIR, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Deleted file: ${filename}`);
        }
      }

      res.json({ success: true, deletedId: videoId });

    } catch (error) {
      console.error('Delete video error:', error);
      res.status(500).json({ error: 'Failed to delete video' });
    }
  });

  return router;
}

export { VIDEOS_DIR };
