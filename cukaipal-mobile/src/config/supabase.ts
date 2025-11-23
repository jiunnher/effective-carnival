import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a project at https://supabase.com
 * 2. Go to Project Settings → API
 * 3. Copy your project URL and anon/public key
 * 4. Replace the values below
 * 5. Enable authentication providers:
 *    - Go to Authentication → Providers
 *    - Enable "Apple" and "Google"
 *    - Add OAuth credentials from Apple/Google Console
 */

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database table names
export const TABLES = {
  RECEIPTS: 'receipts',
  USER_DATA: 'user_data',
  USER_PROFILES: 'user_profiles',
};

/**
 * Supabase Database Schema
 *
 * Run this SQL in Supabase SQL Editor to create tables:
 *
 * -- Enable Row Level Security
 * alter table if exists public.receipts enable row level security;
 * alter table if exists public.user_data enable row level security;
 * alter table if exists public.user_profiles enable row level security;
 *
 * -- Receipts table
 * create table if not exists public.receipts (
 *   id text primary key,
 *   user_id uuid references auth.users not null,
 *   status text not null default 'pending',
 *   amount decimal(10, 2),
 *   description text,
 *   category text,
 *   sub_category text,
 *   date date,
 *   file_url text,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 *
 * -- User data table (for incomeMap and profile)
 * create table if not exists public.user_data (
 *   user_id uuid references auth.users primary key,
 *   income_map jsonb default '{}'::jsonb,
 *   profile jsonb default '{}'::jsonb,
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 *
 * -- User profiles table (for subscription info)
 * create table if not exists public.user_profiles (
 *   id uuid references auth.users primary key,
 *   display_name text,
 *   subscription_status text default 'trial',
 *   subscription_plan text,
 *   trial_ends_at timestamp with time zone,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 *
 * -- Row Level Security Policies
 * -- Users can only access their own data
 *
 * create policy "Users can view own receipts"
 *   on receipts for select
 *   using (auth.uid() = user_id);
 *
 * create policy "Users can insert own receipts"
 *   on receipts for insert
 *   with check (auth.uid() = user_id);
 *
 * create policy "Users can update own receipts"
 *   on receipts for update
 *   using (auth.uid() = user_id);
 *
 * create policy "Users can delete own receipts"
 *   on receipts for delete
 *   using (auth.uid() = user_id);
 *
 * create policy "Users can view own data"
 *   on user_data for select
 *   using (auth.uid() = user_id);
 *
 * create policy "Users can insert own data"
 *   on user_data for insert
 *   with check (auth.uid() = user_id);
 *
 * create policy "Users can update own data"
 *   on user_data for update
 *   using (auth.uid() = user_id);
 *
 * create policy "Users can view own profile"
 *   on user_profiles for select
 *   using (auth.uid() = id);
 *
 * create policy "Users can insert own profile"
 *   on user_profiles for insert
 *   with check (auth.uid() = id);
 *
 * create policy "Users can update own profile"
 *   on user_profiles for update
 *   using (auth.uid() = id);
 *
 * -- Storage bucket for receipt images
 * insert into storage.buckets (id, name, public)
 * values ('receipts', 'receipts', false);
 *
 * create policy "Users can upload own receipts"
 *   on storage.objects for insert
 *   with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
 *
 * create policy "Users can view own receipts"
 *   on storage.objects for select
 *   using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
 *
 * create policy "Users can delete own receipts"
 *   on storage.objects for delete
 *   using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
 */
