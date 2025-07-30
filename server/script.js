// CREATE TABLE tbluser (
//     id SERIAL PRIMARY KEY,
//     email VARCHAR(255) NOT NULL UNIQUE,
//     firstName VARCHAR(100) NOT NULL,
//     lastName VARCHAR(100) NOT NULL,
//     contact VARCHAR(15) NOT NULL,
//     accounts TEXT[] NOT NULL,
//     password TEXT,
//     country TEXT,
//     currency VARCHAR(10), NOT NULL DEFAULT 'USD',
//     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );


// CREATE TABLE tblaccount (
//     id SERIAL PRIMARY KEY,
//     userId INTEGER REFERENCES tbluser(id) ON DELETE CASCADE,
//     account_name VARCHAR(100) NOT NULL,
//     account_number VARCHAR(50) NOT NULL,
//     account_balance NUMERIC (10, 2) NOT NULL DEFAULT 0.00,
//     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// CREATE TABLE tbltransaction (
//     id SERIAL PRIMARY KEY,
//     userId INTEGER REFERENCES tbluser(id) ON DELETE CASCADE,
//     description TEXT NOT NULL,
//     status VARCHAR(20) NOT NULL,
//     source VARCHAR(100) NOT NULL,
//     amount NUMERIC (10, 2) NOT NULL,
//     type VARCHAR(20) NOT NULL,
//     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );


//  SELECT * FROM tbluser
// INSERT INTO tbluser
//   (email, password, firstname, lastname, contact, accounts, country, currency)
// VALUES (
//   'liz@test.com', '12345', 'Liz', 'Test', '987654321', ARRAY['Acct1'], 'USA', 'USD');


// //TODO: So:
// 	•	tbluser.accounts is an array of text strings, e.g., ['bank', 'credit card']
// 	•	tblaccount.userId is a foreign key to the user’s ID, not linked to the accounts array in any direct SQL way

// ⸻

// ✅ Is this “correct”?

// Technically yes, this works if your app’s logic:
// 	•	Treats tbluser.accounts as just labels or categories for frontend use
// 	•	Uses tblaccount to store the real accounts tied to the user by userId

// But conceptually it’s a bit confusing. Why?

// ⸻

// ⚠️ Potential Confusion / Redundancy
// 	•	You’re storing accounts in two places:
// 	1.	In the tblaccount table (with real relational structure)
// 	2.	In the tbluser.accounts array (as unlinked text values)

// This can lead to data getting out of sync. For example:
// 	•	You add a new account to tblaccount for a user, but forget to update the accounts[] array
// 	•	You rename or delete something in one place, but not the other