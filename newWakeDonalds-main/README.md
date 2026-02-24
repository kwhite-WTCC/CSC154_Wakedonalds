# WakeDonalds POS System

A point-of-sale web app for Wake Tech: customers can order as a guest or log in; staff use the restaurant POS; admins manage the menu and orders. Built with Node.js and MySQL.

**Downloading from GitHub?** Use **Code → Download ZIP**, unzip the folder, then open the project folder in a terminal and follow the steps below. You do *not* get `node_modules` in the zip—that's normal; run `npm install` in step 5.

---

## What You Need

- **Node.js** — [Download](https://nodejs.org) (use the LTS version)
- **MySQL** — Easiest: install **XAMPP** ([download](https://www.apachefriends.org)); it includes MySQL and phpMyAdmin. If you already have XAMPP, you don't need to install MySQL separately—just use the one in XAMPP.

---

## How to Set It Up

### 1. Clone or download the project

Clone the repo or download it and unzip. Open a terminal and go into the project folder:

```bash
cd newWakeDonalds
```

(Use the actual folder name after cloning or unzipping.)

### 2. Start MySQL

- **XAMPP:** Open XAMPP Control Panel and click **Start** next to **MySQL**.
- **Standalone MySQL:** Make sure the MySQL service is running.

### 3. Create the database

1. In your browser, go to **http://localhost/phpmyadmin**  
   (If you use XAMPP, start **Apache** in the Control Panel first so phpMyAdmin loads.)
2. Click the **SQL** tab.
3. Open the file **schema.sql** from the project folder in a text editor. Copy everything in it.
4. Paste into the big SQL box in phpMyAdmin and click **Go**.

You should see a success message. That creates the database, tables, admin user, and default menu in one go.

### 4. Create a `.env` file (optional)

Create a `.env` file in the project root to configure the database and email. If you skip this, the app uses defaults (DB password `12345`, email disabled).

**Database** (if your MySQL password is not 12345):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=wakedonalds
```

**Email** (for order confirmation emails—see **Email setup** section below):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=your-email@gmail.com
```

### 5. Install and run the app

In the terminal, from the project folder:

```bash
npm install
npm start
```

When it's ready you'll see **MySQL connected** and **Wakedonalds server is running!**

### 6. Open the app

In your browser go to **http://localhost:8080**.

- **Continue as Guest** — place orders without logging in
- **Admin Login** — manage menu and orders (see Logins below)
- **Restaurant POS** (`/restaurant-pos.html`) — staff order interface
- **Order History** (`/order-history.html`) — view past orders (when logged in)

Admin sign-in:
  - **Email:** admin@wakedonalds.com  
  - **Password:** admin123  

---

## Email setup (order & status emails)

When customers provide an email at checkout, the app can send **order confirmation** emails and **status** emails (Ready for Pickup, Picked Up). To enable these:

### Gmail (recommended for testing)

1. Use a Gmail account with 2-Step Verification enabled.
2. Go to [Google Account → Security → App passwords](https://myaccount.google.com/apppasswords).
3. Create an app password for "Mail" (or "Other").
4. Add these to your `.env`:

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   MAIL_FROM=your-gmail@gmail.com
   ```

### Other SMTP providers

Use your provider's SMTP server and credentials. Common values:

| Provider | SMTP_HOST | SMTP_PORT |
|----------|-----------|-----------|
| Gmail | smtp.gmail.com | 587 |
| Outlook | smtp.office365.com | 587 |
| Yahoo | smtp.mail.yahoo.com | 587 |

If SMTP vars are not set, the app runs normally but skips sending emails (you'll see "Email disabled" in the console).

---

## Logins

| Who    | Email                 | Password  |
|--------|-----------------------|-----------|
| Admin  | admin@wakedonalds.com | admin123  |
| Guest  | —                     | Use "Continue as Guest" |

Only Admin can see the admin panel. Passwords are stored hashed (bcrypt); existing DB users with plain-text passwords still work.

---

## SQL setup (one file)

**schema.sql** is the only SQL file. Run it once to create the database, tables, admin user, and default menu.

- **phpMyAdmin:** Open the SQL tab, paste the full contents of `schema.sql`, click **Go**.
- **Command line:** `mysql -u root -p < schema.sql`

If you already had the database and see *"Unknown column 'ready_email_sent'"* when updating order status, open `schema.sql`, find the commented `ALTER TABLE` lines near the end, uncomment them, run only those two lines in phpMyAdmin, then comment them back out.

For more options (e.g. command-line MySQL), see **MYSQL_SETUP.md**.
