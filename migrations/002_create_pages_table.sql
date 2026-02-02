-- Migration: Create pages table for digital signage pages
-- This table stores URLs (SharePoint, PowerBI, etc) that can be displayed on signage

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  template_type VARCHAR(50) DEFAULT 'iframe',
  public_token UUID UNIQUE NOT NULL,
  refresh_interval INTEGER DEFAULT 300, -- seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- Create index on public_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_pages_public_token ON pages(public_token);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_pages_created_at ON pages(created_at DESC);

-- Insert example SharePoint page (optional - remove in production)
-- INSERT INTO pages (id, title, description, url, template_type, public_token, refresh_interval, view_count)
-- VALUES (
--   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
--   'Sales Dashboard',
--   'SharePoint sales overview',
--   'https://yourcompany.sharepoint.com/sites/sales/dashboard',
--   'iframe',
--   'x9y8z7w6-v5u4-3210-zyxw-vu9876543210',
--   300,
--   0
-- );
