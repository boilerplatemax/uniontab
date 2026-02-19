-- Add Gallery nav items to existing unions that have nav items but no gallery nav item
-- This places Gallery before Contact in the navigation order

-- Step 1: Bump Contact's sort_order by 1 for unions that have no Gallery nav item
UPDATE navigation_items
SET sort_order = sort_order + 1
WHERE built_in_route = 'contact'
  AND union_id NOT IN (
    SELECT DISTINCT union_id FROM navigation_items WHERE built_in_route = 'gallery'
  );

-- Step 2: Insert Gallery nav items for those unions at the position Contact previously occupied
INSERT INTO navigation_items (union_id, label, sort_order, visibility, link_type, built_in_route, is_enabled, is_mandatory, open_in_new_tab)
SELECT
  subq.union_id,
  'Gallery',
  subq.gallery_sort_order,
  'public',
  'built_in_route',
  'gallery',
  true,
  false,
  false
FROM (
  SELECT
    ni.union_id,
    COALESCE(
      (SELECT sort_order - 1 FROM navigation_items WHERE union_id = ni.union_id AND built_in_route = 'contact' LIMIT 1),
      5
    ) AS gallery_sort_order
  FROM (
    SELECT DISTINCT union_id FROM navigation_items
  ) ni
  WHERE ni.union_id NOT IN (
    SELECT DISTINCT union_id FROM navigation_items WHERE built_in_route = 'gallery'
  )
) subq;
