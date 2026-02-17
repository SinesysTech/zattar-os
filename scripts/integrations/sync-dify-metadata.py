#!/usr/bin/env python3
"""
Sync Dify app metadata from Dify API to local database.
Fetches /info, /parameters, and /meta for each app and updates dify_apps.metadata.
"""

import json
import os
import sys
import urllib.request
from datetime import datetime


def load_env():
    """Load environment variables from .env.local"""
    env_path = os.path.join(os.getcwd(), '.env.local')
    if not os.path.exists(env_path):
        print('ERROR: .env.local not found', file=sys.stderr)
        sys.exit(1)

    env = {}
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            env[key.strip()] = value.strip()

    return env


def fetch_dify_apps(supabase_url, supabase_key):
    """Fetch all Dify apps from Supabase"""
    apps_url = f"{supabase_url}/rest/v1/dify_apps?select=id,name,api_url,api_key"
    req = urllib.request.Request(apps_url)
    req.add_header('apikey', supabase_key)
    req.add_header('Authorization', f"Bearer {supabase_key}")

    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))


def fetch_dify_metadata(api_url, api_key):
    """Fetch metadata from Dify API (/info, /parameters, /meta)"""
    base_url = api_url.rstrip('/')
    
    def get_json(path):
        url = f"{base_url}{path}"
        req = urllib.request.Request(url)
        req.add_header('Authorization', f"Bearer {api_key}")
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode('utf-8'))
    
    metadata = {}
    errors = []
    
    # Try to fetch each endpoint independently
    try:
        metadata['info'] = get_json('/info')
    except Exception as e:
        errors.append(f"info: {e}")
    
    try:
        metadata['parameters'] = get_json('/parameters')
    except Exception as e:
        errors.append(f"parameters: {e}")
    
    try:
        metadata['meta'] = get_json('/meta')
    except Exception as e:
        errors.append(f"meta: {e}")
    
    # If all endpoints failed, raise an error
    if not metadata:
        raise Exception(f"All endpoints failed: {'; '.join(errors)}")
    
    # Add error information if any endpoint failed
    if errors:
        metadata['_fetch_errors'] = errors
    
    return metadata


def update_app_metadata(supabase_url, supabase_key, app_id, metadata):
    """Update app metadata in Supabase"""
    update_url = f"{supabase_url}/rest/v1/dify_apps?id=eq.{app_id}"
    
    payload = {
        'metadata': metadata,
        'metadata_updated_at': datetime.utcnow().isoformat() + 'Z'
    }
    
    req = urllib.request.Request(update_url, method='PATCH')
    req.add_header('apikey', supabase_key)
    req.add_header('Authorization', f"Bearer {supabase_key}")
    req.add_header('Content-Type', 'application/json')
    req.data = json.dumps(payload).encode('utf-8')
    
    with urllib.request.urlopen(req) as resp:
        return resp.status == 204


def main():
    print("🔄 Syncing Dify app metadata...\n")
    
    # Load environment
    env = load_env()
    supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = env.get('SUPABASE_SECRET_KEY')
    
    if not supabase_url or not supabase_key:
        print('ERROR: Missing Supabase credentials in .env.local', file=sys.stderr)
        sys.exit(1)
    
    # Fetch all apps
    print("📦 Fetching Dify apps from database...")
    apps = fetch_dify_apps(supabase_url, supabase_key)
    print(f"   Found {len(apps)} apps\n")
    
    # Sync each app
    success_count = 0
    partial_count = 0
    error_count = 0
    
    success_apps = []
    partial_apps = []
    error_apps = []
    
    for app in apps:
        app_id = app['id']
        app_name = app.get('name', 'Unnamed')
        api_url = app['api_url']
        api_key = app['api_key']
        
        try:
            print(f"🔍 {app_name} ({app_id[:8]}...)")
            
            # Fetch metadata from Dify
            metadata = fetch_dify_metadata(api_url, api_key)
            
            # Update in database
            update_app_metadata(supabase_url, supabase_key, app_id, metadata)
            
            # Check if there were any errors during fetch
            if '_fetch_errors' in metadata:
                print(f"   ⚠️  Partial sync (errors: {', '.join(metadata['_fetch_errors'])})")
                partial_count += 1
                partial_apps.append((app_name, metadata['_fetch_errors']))
            else:
                print(f"   ✅ Synced successfully")
                success_count += 1
                success_apps.append(app_name)
            
        except Exception as e:
            print(f"   ❌ Error: {e}", file=sys.stderr)
            error_count += 1
            error_apps.append((app_name, str(e)))
        
        print()
    
    # Summary
    print("=" * 50)
    print(f"✅ Success: {success_count}")
    print(f"⚠️  Partial: {partial_count}")
    print(f"❌ Errors:  {error_count}")
    print(f"📊 Total:   {len(apps)}")
    print("=" * 50)
    
    if partial_count > 0:
        print("\n⚠️  APPS COM SINCRONIZAÇÃO PARCIAL:")
        print("=" * 50)
        for app_name, errors in partial_apps:
            print(f"• {app_name}")
            for error in errors:
                print(f"  - {error}")
        print()
    
    if error_count > 0:
        print("\n❌ APPS COM ERRO COMPLETO:")
        print("=" * 50)
        for app_name, error in error_apps:
            print(f"• {app_name}: {error}")
        print()
        sys.exit(1)


if __name__ == '__main__':
    main()
