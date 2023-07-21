DROP TABLE IF EXISTS visitors;
CREATE TABLE IF NOT EXISTS visitors  (
	country TEXT,
	city TEXT,
	latitude REAL,
	longitude REAL,
	ip TEXT PRIMARY KEY
);

