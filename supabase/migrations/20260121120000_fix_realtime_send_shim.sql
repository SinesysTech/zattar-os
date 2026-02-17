-- Migration: fix_realtime_send_shim
-- Description: Creates a compatibility shim for realtime.send to fix "function does not exist" errors
-- Date: 2026-01-21

-- Ensure the schema exists
CREATE SCHEMA IF NOT EXISTS realtime;

-- Create the shim function
-- Error observed: function realtime.send(text, unknown, jsonb, boolean) does not exist
CREATE OR REPLACE FUNCTION realtime.send(
    topic text,
    event text,
    payload jsonb,
    private boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- This function acts as a shim for legacy or broken triggers calling realtime.send
    -- It uses pg_notify to ensure some visibility of the event, 
    -- but primarily it exists to prevent the transaction from failing.
    
    -- Log the call for debugging purposes (optional, can be noisy)
    -- RAISE NOTICE 'Shim realtime.send called: % %', topic, event;
    
    PERFORM pg_notify(
        'realtime_debug',
        jsonb_build_object(
            'topic', topic,
            'event', event,
            'shimmed', true
        )::text
    );
END;
$$;

COMMENT ON FUNCTION realtime.send(text, text, jsonb, boolean) IS 'Shim interface for realtime.send to unblock database transactions failing due to missing function signature.';
