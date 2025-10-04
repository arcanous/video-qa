-- Migration to change phash column from BIGINT to TEXT
-- This fixes the "bigint out of range" error when storing perceptual hashes

-- Check if phash column exists and is BIGINT, then alter it to TEXT
DO $$
BEGIN
    -- Check if the frames table exists and has a phash column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'frames' 
        AND column_name = 'phash' 
        AND data_type = 'bigint'
    ) THEN
        -- Alter the column type from BIGINT to TEXT
        ALTER TABLE frames ALTER COLUMN phash TYPE TEXT;
        RAISE NOTICE 'Successfully migrated phash column from BIGINT to TEXT';
    ELSE
        RAISE NOTICE 'phash column does not exist or is not BIGINT type, skipping migration';
    END IF;
END $$;
