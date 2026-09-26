import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
let datasourceUrl;

if (databaseUrl) {
	const parsedUrl = new URL(databaseUrl);
	if (parsedUrl.hostname.endsWith(".pooler.supabase.com") && parsedUrl.port === "6543") {
		parsedUrl.searchParams.set("pgbouncer", "true");
		parsedUrl.searchParams.set("connection_limit", "1");
		datasourceUrl = parsedUrl.toString();
	}
}

export const prisma = new PrismaClient(
	datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : undefined
);
