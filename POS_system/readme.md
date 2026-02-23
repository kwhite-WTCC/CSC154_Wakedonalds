# WakeDonalds POS System

A simple point-of-sale web app: customers can order as a guest or log in; admins manage the menu and orders. Built with Node.js and MySQL.

**Downloading from GitHub?** Use **Code → Download ZIP**, unzip the folder, then open the **POS_system** folder and follow the steps below. You do *not* get `node_modules` in the zip—that’s normal; run `npm install` in step 5.

---

## What You Need

- **Node.js** — [Download](https://nodejs.org) (use the LTS version)
- **MySQL** — Easiest: install **XAMPP** ([download](https://www.apachefriends.org)); it includes MySQL and phpMyAdmin. If you already have XAMPP, you don’t need to install MySQL separately—just use the one in XAMPP.

---

## How to Set It Up


Clone the repo or download it and unzip. Open a terminal and go into the `POS_system` folder:

```bash
cd POS_system
```

### 2. Start MySQL

- **XAMPP:** Open XAMPP Control Panel and click **Start** next to **MySQL**.
- **Standalone MySQL:** Make sure the MySQL service is running.

### 3. Create the database

1. In your browser, go to **http://localhost/phpmyadmin**  
   (If you use XAMPP, start **Apache** in the Control Panel first so phpMyAdmin loads.)
2. Click the **SQL** tab.
3. Open the file **schema.sql** from the `POS_system` folder in a text editor. Copy everything in it.
4. Paste into the big SQL box in phpMyAdmin and click **Go**.

You should see a success message. That creates the database and the admin user.

**Optional:** Do the same for **seed_menu.sql** (adds the default menu) and **set_roles.sql** (sets admin role). Paste each file’s contents into the SQL tab and click **Go**.

### 4. Set the database password (only if yours is different)

The app expects the MySQL password to be **12345**. If your MySQL root password is **12345**, skip this.

If it’s different (or empty, like on a fresh XAMPP install), either:

- **Option A:** In the same terminal where you’ll run the app, set the password before starting:
  - **PowerShell:** `$env:DB_PASSWORD = "your_password"`
  - **Command Prompt:** `set DB_PASSWORD=your_password`
- **Option B:** Edit **db.js** and change the default password (search for `12345` and replace it).

### 5. Install and run the app

In the terminal, still in the `POS_system` folder:

```bash
npm install
node server.js
```

When it’s ready you’ll see something like: **MySQL connected** and **Wakedonalds server is running!**

### 6. Open the app

In your browser go to: **http://localhost:8080**

- Click **Continue as Guest** to try ordering.
- Or click **Admin Login** and sign in with:
  - **Email:** admin@wakedonalds.com  
  - **Password:** admin123  

---

## Logins

| Who    | Email                 | Password  |
|--------|-----------------------|-----------|
| Admin  | admin@wakedonalds.com | admin123  |
| Guest  | —                     | Use “Continue as Guest” |

Only Admin can see the admin panel. Passwords are stored hashed (bcrypt); existing DB users with plain-text passwords still work.

---

## SQL Files (what they do)

| File              | Use it to… |
|-------------------|------------|
| **schema.sql**    | Create the database and tables (run this first). |
| **seed_menu.sql** | Load the default menu (optional). |
| **set_roles.sql** | Set admin role (optional). |

Run them in phpMyAdmin’s SQL tab: paste the file contents and click **Go**.
