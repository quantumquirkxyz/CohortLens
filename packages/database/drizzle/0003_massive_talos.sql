ALTER TABLE "capital_flows" ADD COLUMN "subgraph_id" text;--> statement-breakpoint
ALTER TABLE "capital_flows" ADD CONSTRAINT "capital_flows_subgraph_id_uq" UNIQUE("subgraph_id");