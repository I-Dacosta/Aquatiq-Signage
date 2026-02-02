-- Database Optimization: Partition screen_status_logs for scalability
-- This improves query performance for high-volume logging

-- Step 1: Rename existing table (if not already partitioned)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'screen_status_logs_old'
  ) THEN
    ALTER TABLE IF EXISTS screen_status_logs RENAME TO screen_status_logs_old;
  END IF;
END
$$;

-- Step 2: Create partitioned table
CREATE TABLE IF NOT EXISTS screen_status_logs (
  id UUID DEFAULT gen_random_uuid(),
  screen_id UUID NOT NULL,
  status VARCHAR(50),
  content_id UUID,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Step 3: Create partitions for current and upcoming months
CREATE TABLE IF NOT EXISTS screen_status_logs_2026_01 PARTITION OF screen_status_logs
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS screen_status_logs_2026_02 PARTITION OF screen_status_logs
FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS screen_status_logs_2026_03 PARTITION OF screen_status_logs
FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS screen_status_logs_2026_04 PARTITION OF screen_status_logs
FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS screen_status_logs_2026_05 PARTITION OF screen_status_logs
FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS screen_status_logs_2026_06 PARTITION OF screen_status_logs
FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Step 4: Migrate old data (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'screen_status_logs_old'
  ) THEN
    INSERT INTO screen_status_logs
    SELECT * FROM screen_status_logs_old;
    
    DROP TABLE screen_status_logs_old;
  END IF;
END
$$;

-- Step 5: Create indexes on partitions
CREATE INDEX IF NOT EXISTS idx_screen_logs_screen_created 
  ON screen_status_logs(screen_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_screen_logs_status 
  ON screen_status_logs(status);

-- Step 6: Function to automatically create future partitions
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
  partition_date date := date_trunc('month', CURRENT_DATE + interval '1 month');
  partition_name text := 'screen_status_logs_' || to_char(partition_date, 'YYYY_MM');
  next_month date := partition_date + interval '1 month';
BEGIN
  -- Check if partition already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = partition_name
  ) THEN
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF screen_status_logs
       FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      partition_date,
      next_month
    );
    
    RAISE NOTICE 'Created partition: %', partition_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create cron job to auto-create partitions (requires pg_cron extension)
-- Run this manually each month or set up pg_cron:
-- SELECT cron.schedule('create-partitions', '0 0 1 * *', 'SELECT create_monthly_partition()');

COMMENT ON FUNCTION create_monthly_partition() IS 
'Automatically creates next month partition for screen_status_logs. 
Run monthly or set up with pg_cron extension.';

-- Step 8: Create foreign key constraints
ALTER TABLE screen_status_logs
  ADD CONSTRAINT fk_screen_logs_screen 
  FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE;

ALTER TABLE screen_status_logs
  ADD CONSTRAINT fk_screen_logs_content 
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE SET NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Partitioning complete! Run create_monthly_partition() monthly to create new partitions.';
END
$$;
