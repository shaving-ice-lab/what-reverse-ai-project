mkdir -p apps/server/data/vm
sqlite3 apps/server/data/vm/8930350b-79b7-4307-ae2b-a426375fa2e7.db < docs/init-database.sql

cd apps/server && go run cmd/seed/main.go