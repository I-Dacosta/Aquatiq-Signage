-- Create short_urls table for storing short URL mappings
CREATE TABLE IF NOT EXISTS short_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  template VARCHAR(50) DEFAULT 'office-basic',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 year',
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP
);

-- Index for fast lookup by short_id
CREATE INDEX idx_short_urls_short_id ON short_urls(short_id);

-- Index for cleanup of expired URLs
CREATE INDEX idx_short_urls_expires ON short_urls(expires_at);

-- Function to clean up expired short URLs (run monthly)
CREATE OR REPLACE FUNCTION cleanup_expired_short_urls()
RETURNS void AS $$
BEGIN
  DELETE FROM short_urls WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Optional: Update access count when URL is used
CREATE OR REPLACE FUNCTION update_short_url_access()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE short_urls 
  SET access_count = access_count + 1,
      last_accessed = CURRENT_TIMESTAMP
  WHERE short_id = NEW.short_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
