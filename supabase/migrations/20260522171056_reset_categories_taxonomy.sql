alter table api.categories
  add column if not exists water_saved_liters_per_kg numeric not null default 50;

insert into api.categories (slug, label, parent_slug, co2_factor_per_kg, water_saved_liters_per_kg)
values
  ('food-scraps', 'Food Scraps', null, 0.5, 50),
  ('spent-grain', 'Spent Grain', null, 1.2, 120),
  ('coffee-grounds', 'Coffee Grounds', null, 0.8, 80),
  ('vegetable-scraps', 'Vegetable Scraps', null, 0.4, 40),
  ('fruit-waste', 'Fruit Waste', null, 0.6, 65),
  ('surplus-meals', 'Surplus Meals', null, 2.5, 250)
on conflict (slug) do update
set
  label = excluded.label,
  parent_slug = excluded.parent_slug,
  co2_factor_per_kg = excluded.co2_factor_per_kg,
  water_saved_liters_per_kg = excluded.water_saved_liters_per_kg;

update api.listings
set category_slug = case category_slug
  when 'spent-grain' then 'spent-grain'
  when 'coffee-grounds' then 'coffee-grounds'
  when 'vegetable-scraps' then 'vegetable-scraps'
  when 'fruit-waste' then 'fruit-waste'
  when 'surplus-meals' then 'surplus-meals'
  when 'surplus-packaged-food' then 'surplus-meals'
  when 'organic' then 'food-scraps'
  when 'tea-leaves' then 'food-scraps'
  when 'eggshells' then 'food-scraps'
  when 'bread-stale' then 'food-scraps'
  when 'rice-cooked' then 'food-scraps'
  when 'fish-bones-shells' then 'food-scraps'
  when 'meat-trimmings' then 'food-scraps'
  when 'brewery-fermentation' then 'spent-grain'
  when 'fruit-pomace' then 'fruit-waste'
  when 'whey' then 'food-scraps'
  when 'sourdough-discard' then 'food-scraps'
  when 'yeast-slurry' then 'food-scraps'
  when 'agricultural' then 'food-scraps'
  when 'blemished-produce' then 'food-scraps'
  when 'crop-trimmings' then 'food-scraps'
  when 'husks-bran' then 'food-scraps'
  when 'processing-by-products' then 'food-scraps'
  when 'cooking-oil-used' then 'food-scraps'
  when 'food-processing-waste' then 'food-scraps'
  when 'other' then 'food-scraps'
  when 'compostable-packaging' then 'food-scraps'
  when 'garden-waste' then 'food-scraps'
  else 'food-scraps'
end
where category_slug not in (
  'food-scraps',
  'spent-grain',
  'coffee-grounds',
  'vegetable-scraps',
  'fruit-waste',
  'surplus-meals'
);

update api.requests
set category_slug = case category_slug
  when 'spent-grain' then 'spent-grain'
  when 'coffee-grounds' then 'coffee-grounds'
  when 'vegetable-scraps' then 'vegetable-scraps'
  when 'fruit-waste' then 'fruit-waste'
  when 'surplus-meals' then 'surplus-meals'
  when 'surplus-packaged-food' then 'surplus-meals'
  when 'organic' then 'food-scraps'
  when 'tea-leaves' then 'food-scraps'
  when 'eggshells' then 'food-scraps'
  when 'bread-stale' then 'food-scraps'
  when 'rice-cooked' then 'food-scraps'
  when 'fish-bones-shells' then 'food-scraps'
  when 'meat-trimmings' then 'food-scraps'
  when 'brewery-fermentation' then 'spent-grain'
  when 'fruit-pomace' then 'fruit-waste'
  when 'whey' then 'food-scraps'
  when 'sourdough-discard' then 'food-scraps'
  when 'yeast-slurry' then 'food-scraps'
  when 'agricultural' then 'food-scraps'
  when 'blemished-produce' then 'food-scraps'
  when 'crop-trimmings' then 'food-scraps'
  when 'husks-bran' then 'food-scraps'
  when 'processing-by-products' then 'food-scraps'
  when 'cooking-oil-used' then 'food-scraps'
  when 'food-processing-waste' then 'food-scraps'
  when 'other' then 'food-scraps'
  when 'compostable-packaging' then 'food-scraps'
  when 'garden-waste' then 'food-scraps'
  else 'food-scraps'
end
where category_slug not in (
  'food-scraps',
  'spent-grain',
  'coffee-grounds',
  'vegetable-scraps',
  'fruit-waste',
  'surplus-meals'
);

delete from api.categories
where slug not in (
  'food-scraps',
  'spent-grain',
  'coffee-grounds',
  'vegetable-scraps',
  'fruit-waste',
  'surplus-meals'
);

update api.categories
set
  label = case slug
    when 'food-scraps' then 'Food Scraps'
    when 'spent-grain' then 'Spent Grain'
    when 'coffee-grounds' then 'Coffee Grounds'
    when 'vegetable-scraps' then 'Vegetable Scraps'
    when 'fruit-waste' then 'Fruit Waste'
    when 'surplus-meals' then 'Surplus Meals'
    else label
  end,
  parent_slug = null,
  co2_factor_per_kg = case slug
    when 'food-scraps' then 0.5
    when 'spent-grain' then 1.2
    when 'coffee-grounds' then 0.8
    when 'vegetable-scraps' then 0.4
    when 'fruit-waste' then 0.6
    when 'surplus-meals' then 2.5
    else co2_factor_per_kg
  end,
  water_saved_liters_per_kg = case slug
    when 'food-scraps' then 50
    when 'spent-grain' then 120
    when 'coffee-grounds' then 80
    when 'vegetable-scraps' then 40
    when 'fruit-waste' then 65
    when 'surplus-meals' then 250
    else water_saved_liters_per_kg
  end;

update api.categories
set id = id + 1000
where slug in (
  'food-scraps',
  'spent-grain',
  'coffee-grounds',
  'vegetable-scraps',
  'fruit-waste',
  'surplus-meals'
);

update api.categories
set id = case slug
  when 'food-scraps' then 1
  when 'spent-grain' then 2
  when 'coffee-grounds' then 3
  when 'vegetable-scraps' then 4
  when 'fruit-waste' then 5
  when 'surplus-meals' then 6
end
where slug in (
  'food-scraps',
  'spent-grain',
  'coffee-grounds',
  'vegetable-scraps',
  'fruit-waste',
  'surplus-meals'
);

select setval(pg_get_serial_sequence('api.categories', 'id'), 6, true);
