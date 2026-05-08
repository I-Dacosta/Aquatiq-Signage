-- Migration: Add slug column to screens table for friendly URLs
-- Created: 2026-02-19

-- Add slug column
ALTER TABLE screens 
ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_screens_slug ON screens(slug);

-- Generate slugs for existing screens based on their names
-- Convert to lowercase, replace spaces with hyphens, remove special characters
UPDATE screens 
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    )
)
WHERE slug IS NULL;

-- Handle duplicates by appending the first 8 characters of the UUID
UPDATE screens s1
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(s1.name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    )
) || '-' || LEFT(s1.id::TEXT, 8)
WHERE slug IN (
    SELECT slug 
    FROM screens 
    GROUP BY slug 
    HAVING COUNT(*) > 1
);

COMMENT ON COLUMN screens.slug IS 'URL-friendly identifier for the screen (e.g., "main-office")';
