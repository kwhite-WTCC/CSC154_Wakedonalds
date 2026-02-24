# MySQL setup for Wakedonalds POS

## 1. Install MySQL

Install MySQL Server (or MariaDB) on your machine if you haven’t already.

- Windows: [MySQL Installer](https://dev.mysql.com/downloads/installer/)
- Mac: `brew install mysql` or use the official installer

## 2. Create the database and tables

From a terminal (or MySQL Workbench), run the schema file:

```bash
mysql -u root -p < schema.sql
```

Or log in to MySQL and run the contents of `schema.sql`:

```bash
mysql -u root -p
```

Then paste or run the SQL from `schema.sql` (creates database `wakedonalds`, tables `users`, `menu_items`, `orders`, and seeds the admin user).

## 3. Configure the app

Set environment variables so the app can connect (optional; these are the defaults):

| Variable     | Default        | Description        |
|-------------|----------------|--------------------|
| `DB_HOST`   | localhost      | MySQL server       |
| `DB_USER`   | root           | MySQL username     |
| `DB_PASSWORD` | (empty)      | MySQL password     |
| `DB_NAME`   | wakedonalds    | Database name      |

**Windows (PowerShell, one-time for the session):**

```powershell
$env:DB_USER = "root"
$env:DB_PASSWORD = "your_mysql_password"
```

**Or create a `.env` file** in the `POS_system` folder (and add `require('dotenv').config()` at the top of `server.js` if you use the `dotenv` package).

## 4. Install dependencies and start the server

```bash
cd POS_system
npm install
node server.js
```

If MySQL is connected, you’ll see: `✅ MySQL connected: wakedonalds`  
If not, the app still runs using in-memory auth and localStorage for menu/orders.

## 5. Admin login (with MySQL)

After running the schema, you can sign in with:

- **Email:** admin@wakedonalds.com  
- **Password:** admin123  

(Change the password in the `users` table for production.)

## What is stored in MySQL

- **users** – Sign-up and login (admin and customers).
- **menu_items** – Menu (loaded from API; seeded with defaults if the table is empty).
- **orders** – Each order (customer, phone, total, status, and `items` as JSON).

The frontend uses the API when the server is running: menu and orders are loaded from/saved to MySQL when the connection is available; otherwise it falls back to localStorage.
