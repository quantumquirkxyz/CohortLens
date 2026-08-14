CREATE TABLE "sync_state" (
	"chain_id" text PRIMARY KEY NOT NULL,
	"last_block" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
