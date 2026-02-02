-- Migration: Create videos table for video management
-- Created: 2025-11-26

CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    filename VARCHAR(255),
    original_name VARCHAR(255),
    sharepoint_url TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT NOW(),
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on upload_date for sorting
CREATE INDEX IF NOT EXISTS idx_videos_upload_date ON videos(upload_date DESC);

-- Create index on title for searching
CREATE INDEX IF NOT EXISTS idx_videos_title ON videos(title);

COMMENT ON TABLE videos IS 'Stores video metadata for the digital signage system';
COMMENT ON COLUMN videos.id IS 'Unique identifier for the video';
COMMENT ON COLUMN videos.title IS 'Display title of the video';
COMMENT ON COLUMN videos.description IS 'Optional description of the video content';
COMMENT ON COLUMN videos.filename IS 'File name for locally stored videos';
COMMENT ON COLUMN videos.original_name IS 'Original file name when uploaded';
COMMENT ON COLUMN videos.sharepoint_url IS 'URL for SharePoint-hosted videos';
COMMENT ON COLUMN videos.file_size IS 'Size of the video file in bytes';
COMMENT ON COLUMN videos.mime_type IS 'MIME type of the video file';
COMMENT ON COLUMN videos.upload_date IS 'Date and time when the video was uploaded';
COMMENT ON COLUMN videos.view_count IS 'Number of times the video has been viewed';
