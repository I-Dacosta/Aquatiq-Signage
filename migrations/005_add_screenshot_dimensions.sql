-- Add screenshot dimensions to pages table
ALTER TABLE pages ADD COLUMN screenshot_width INTEGER DEFAULT 1920;
ALTER TABLE pages ADD COLUMN screenshot_height INTEGER DEFAULT 1080;

-- Add index for common dimension queries
CREATE INDEX idx_pages_screenshot_dimensions ON pages(screenshot_width, screenshot_height);

-- Add comment
COMMENT ON COLUMN pages.screenshot_width IS 'Screenshot viewport width in pixels (default: 1920)';
COMMENT ON COLUMN pages.screenshot_height IS 'Screenshot viewport height in pixels (default: 1080)';
