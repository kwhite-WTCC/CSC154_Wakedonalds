-- Run this in phpMyAdmin (SQL tab, database wakedonalds) to fill menu_items
-- with the same default menu as the website.

USE wakedonalds;

-- Clear existing so we don't get duplicates (optional: remove this line if you want to keep current items)
TRUNCATE TABLE menu_items;

INSERT INTO menu_items (name, cat, price, description, emoji, tag, active) VALUES
('Fries', 'Starters', 5, 'Crispy golden fries', '🍟', 'popular', 1),
('Crunchwrap Supreme', 'Mains', 9, 'Flour tortilla, seasoned beef, nacho cheese, lettuce, tomato', '🌯', 'popular', 1),
('Tonkotsu Ramen', 'Mains', 14, 'Rich pork broth, noodles, chashu pork, soft-boiled egg', '🍜', '', 1),
('Chicken Filet Sandwich', 'Mains', 10, 'Crispy chicken filet, lettuce, pickles, brioche bun', '🥪', 'popular', 1),
('Burger', 'Mains', 11, 'Beef patty, cheese, lettuce, tomato, special sauce', '🍔', '', 1),
('Hot Dog', 'Mains', 7, 'All-beef frank, mustard, ketchup, relish', '🌭', '', 1),
('Spicy Pasta', 'Pasta & Risotto', 12, 'Rigatoni, spicy tomato sauce, parmigiano', '🍝', 'spicy', 1),
('Mac & Cheese', 'Pasta & Risotto', 10, 'Creamy cheddar sauce, elbow pasta, breadcrumb topping', '🧀', 'popular', 1),
('Ice Cream', 'Desserts', 4, 'Vanilla soft serve, cone or cup', '🍦', 'popular', 1),
('Chocolate Brownie', 'Desserts', 5, 'Warm fudge brownie, powdered sugar', '🍫', '', 1),
('Apple Pie', 'Desserts', 4, 'Flaky crust, cinnamon apple filling', '🥧', '', 1),
('Water', 'Drinks', 1, 'Cold bottled water', '💧', '', 1),
('Soda', 'Drinks', 3, 'Coke, Sprite, or Dr. Pepper', '🥤', 'popular', 1),
('Milkshake', 'Drinks', 6, 'Vanilla, chocolate, or strawberry', '🥛', '', 1);
