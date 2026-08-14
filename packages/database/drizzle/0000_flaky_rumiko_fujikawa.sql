CREATE TYPE "public"."flow_type" AS ENUM('Deposit', 'Borrow', 'Repay', 'Withdraw', 'Swap', 'Transfer');--> statement-breakpoint
CREATE TYPE "public"."node_type" AS ENUM('wallet', 'protocol', 'chain', 'asset', 'pool', 'position');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"chain_id" text NOT NULL,
	"decimals" integer DEFAULT 18 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_symbol_chain_uq" UNIQUE("symbol","chain_id")
);
--> statement-breakpoint
CREATE TABLE "capital_flows" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"from_node_id" text NOT NULL,
	"from_node_type" "node_type" NOT NULL,
	"to_node_id" text NOT NULL,
	"to_node_type" "node_type" NOT NULL,
	"type" "flow_type" NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"asset_id" text NOT NULL,
	"chain_id" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chains" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"rpc_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chains_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cohort_metrics" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"wallet_ids" jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pools" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"protocol_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"wallet_id" text NOT NULL,
	"pool_id" text NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "positions_wallet_pool_type_uq" UNIQUE("wallet_id","pool_id","type")
);
--> statement-breakpoint
CREATE TABLE "protocol_metrics" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"protocol_id" text NOT NULL,
	"metric" text NOT NULL,
	"value" numeric(36, 18) NOT NULL,
	"measured_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocols" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"chain_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"address" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_chain_id_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."chains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_flows" ADD CONSTRAINT "capital_flows_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_flows" ADD CONSTRAINT "capital_flows_chain_id_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."chains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_metrics" ADD CONSTRAINT "protocol_metrics_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_chain_id_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."chains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_chain_idx" ON "assets" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX "capital_flows_from_idx" ON "capital_flows" USING btree ("from_node_id");--> statement-breakpoint
CREATE INDEX "capital_flows_to_idx" ON "capital_flows" USING btree ("to_node_id");--> statement-breakpoint
CREATE INDEX "capital_flows_type_idx" ON "capital_flows" USING btree ("type");--> statement-breakpoint
CREATE INDEX "capital_flows_timestamp_idx" ON "capital_flows" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "capital_flows_path_idx" ON "capital_flows" USING btree ("from_node_id","to_node_id","timestamp");--> statement-breakpoint
CREATE INDEX "pools_protocol_idx" ON "pools" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "pools_asset_idx" ON "pools" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "positions_wallet_idx" ON "positions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "protocol_metrics_protocol_idx" ON "protocol_metrics" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "protocols_chain_idx" ON "protocols" USING btree ("chain_id");