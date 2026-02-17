-- Add home_page field to unions table for custom home page selection
ALTER TABLE "unions" ADD COLUMN IF NOT EXISTS "home_page" varchar(255) NOT NULL DEFAULT 'news';

-- Add icon field to navigation_items table for custom nav icons
ALTER TABLE "navigation_items" ADD COLUMN IF NOT EXISTS "icon" varchar(50);
