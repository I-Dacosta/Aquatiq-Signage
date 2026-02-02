-- Migration: Add display mode and authentication support to pages table

-- Add display_mode column
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS display_mode VARCHAR(20) DEFAULT 'iframe' 
CHECK (display_mode IN ('screenshot', 'realtime', 'iframe'));

-- Add screenshot_interval column
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS screenshot_interval INTEGER DEFAULT 60;

-- Add authentication columns
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS requires_auth BOOLEAN DEFAULT false;

ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS auth_status VARCHAR(20) DEFAULT 'pending' 
CHECK (auth_status IN ('pending', 'authenticated', 'failed'));

ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS auth_cookies JSONB;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_pages_display_mode ON pages(display_mode);
CREATE INDEX IF NOT EXISTS idx_pages_requires_auth ON pages(requires_auth);

-- Update screenshot_pages table to link with pages
ALTER TABLE screenshot_pages 
ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES pages(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_screenshot_pages_page_id ON screenshot_pages(page_id);
