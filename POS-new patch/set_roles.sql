-- Run once in phpMyAdmin (wakedonalds database) to set roles.
-- Only two roles: admin, customer.

USE wakedonalds;

-- Set admin user to role 'admin' (in case they were created with old seed)
UPDATE users SET role = 'admin' WHERE email = 'admin@wakedonalds.com';

-- Ensure everyone else is customer (optional safety)
-- UPDATE users SET role = 'customer' WHERE role != 'admin';
