-- Create screenshot_pages table
CREATE TABLE IF NOT EXISTS screenshot_pages (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  public_token UUID UNIQUE NOT NULL,
  cookies JSONB, -- Store authentication cookies if needed
  refresh_interval INTEGER DEFAULT 60, -- Seconds between refreshes on display
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_captured TIMESTAMP -- Last time screenshot was taken
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_screenshot_pages_public_token ON screenshot_pages(public_token);
CREATE INDEX IF NOT EXISTS idx_screenshot_pages_active ON screenshot_pages(active);
CREATE INDEX IF NOT EXISTS idx_screenshot_pages_created_at ON screenshot_pages(created_at DESC);
