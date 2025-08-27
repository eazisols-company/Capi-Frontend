-- Create enum types
CREATE TYPE public.submission_status AS ENUM ('pending', 'submitted', 'failed');
CREATE TYPE public.currency_type AS ENUM ('EUR', 'USD');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL UNIQUE DEFAULT 'ACC-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  system_currency currency_type DEFAULT 'EUR',
  billing_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create connections table
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pixel_id TEXT NOT NULL,
  pixel_access_token TEXT NOT NULL,
  countries JSONB NOT NULL DEFAULT '[]', -- Array of {country: string, value: number}
  submission_link TEXT,
  use_custom_domain BOOLEAN DEFAULT FALSE,
  custom_domain TEXT,
  domain_verified BOOLEAN DEFAULT FALSE,
  ssl_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,
  status submission_status DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE,
  meta_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opt_in_settings table
CREATE TABLE public.opt_in_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#FACC15', -- Yellow
  secondary_color TEXT DEFAULT '#10B981', -- Poison green
  logo_url TEXT,
  page_title TEXT DEFAULT 'Join Our Premium Trading Platform',
  page_subtitle TEXT DEFAULT 'Start your trading journey today',
  form_title TEXT DEFAULT 'Get Started',
  submit_button_text TEXT DEFAULT 'Join Now',
  font_family TEXT DEFAULT 'Inter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opt_in_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own connections" ON public.connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own connections" ON public.connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own submissions" ON public.submissions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own opt-in settings" ON public.opt_in_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own opt-in settings" ON public.opt_in_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  INSERT INTO public.opt_in_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_opt_in_settings_updated_at
  BEFORE UPDATE ON public.opt_in_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();