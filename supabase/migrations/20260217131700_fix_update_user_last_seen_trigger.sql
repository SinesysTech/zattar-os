-- Fix: trigger function referenced non-existent column "last_seen_at" instead of "last_seen"
-- Also refactored to modify NEW directly (correct pattern for BEFORE triggers)
CREATE OR REPLACE FUNCTION "public"."update_user_last_seen"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  new.last_seen = now();
  return new;
end;
$$;
