-- Wakedonalds POS - MySQL setup (one file: database, tables, admin, default menu)
-- Run once for a fresh install:  mysql -u root -p < schema.sql
-- Or in phpMyAdmin: create database wakedonalds, then paste this file into the SQL tab.

CREATE DATABASE IF NOT EXISTS wakedonalds;
USE wakedonalds;

-- Users (login/register; admin = admin@wakedonalds.com)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu items (description_es = optional Spanish)
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cat VARCHAR(80) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  description_es TEXT,
  emoji VARCHAR(10) DEFAULT '🍽️',
  tag VARCHAR(20) DEFAULT '',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders (items stored as JSON)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_num VARCHAR(20) NOT NULL UNIQUE,
  customer VARCHAR(100) NOT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  notes TEXT,
  items JSON,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'In Progress',
  ready_email_sent TINYINT(1) NOT NULL DEFAULT 0,
  picked_up_email_sent TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin user (password: admin123 — change in production!)
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Admin', 'admin@wakedonalds.com', 'admin123', 'admin');

-- Default menu (run once; skip or delete this block if you already have items)
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

-- ─── Existing database only: if you see "Unknown column 'ready_email_sent'" when updating order status,
--     uncomment and run the next two lines (then comment them out again so re-runs don't error):
-- ALTER TABLE orders ADD COLUMN ready_email_sent TINYINT(1) NOT NULL DEFAULT 0;
-- ALTER TABLE orders ADD COLUMN picked_up_email_sent TINYINT(1) NOT NULL DEFAULT 0;

-- ─── If admin user exists but lost admin role, run:
-- UPDATE users SET role = 'admin' WHERE email = 'admin@wakedonalds.com';
