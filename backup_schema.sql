


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."fn_broadcast_batches"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'batch:' || COALESCE(NEW.batch_id, OLD.batch_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_batches"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_cart_items"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'cart_items:' || COALESCE(NEW.cart_id, OLD.cart_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_cart_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_carts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'cart:' || COALESCE(NEW.cart_id, OLD.cart_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_carts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_complaints"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'complaint:' || COALESCE(NEW.order_id, OLD.order_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_complaints"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_deliveries"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'delivery:' || COALESCE(NEW.order_id, OLD.order_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_deliveries"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_group_buy_members"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'group_buy_members:' || COALESCE(NEW.group_id, OLD.group_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_group_buy_members"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_group_buys"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'group_buy:' || COALESCE(NEW.group_id, OLD.group_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_group_buys"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_inventory"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'inventory:' || COALESCE(NEW.batch_id, OLD.batch_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_inventory"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_inventory_transactions"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'inventory_transactions:' || COALESCE(NEW.batch_id, OLD.batch_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_inventory_transactions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_order_tracking"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'order_tracking:' || COALESCE(NEW.tracking_id, OLD.tracking_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_order_tracking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_orders"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'order:' || COALESCE(NEW.order_id, OLD.order_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_orders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_payments"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'payment:' || COALESCE(NEW.order_id, OLD.order_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_payments"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_posts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'post:' || COALESCE(NEW.post_id, OLD.post_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_posts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_prices"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'price:' || COALESCE(NEW.price_id, OLD.price_id)::text || ':events',
    TG_OP, TG_OP,
    TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_prices"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_products"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'product:' || COALESCE(NEW.product_id, OLD.product_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_products"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_reviews"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'review:' || COALESCE(NEW.review_id, OLD.review_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_reviews"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_broadcast_subscriptions"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'subscription:' || COALESCE(NEW.user_id, OLD.user_id)::text || ':events',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA,
    NEW, OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_broadcast_subscriptions"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."batches" (
    "batch_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid",
    "supplier_id" "uuid",
    "harvest_date" "date" NOT NULL,
    "expire_date" "date" NOT NULL,
    "quantity" integer NOT NULL,
    "qr_code" character varying(255),
    "status" character varying(20) DEFAULT 'available'::character varying,
    "created_at" "date" DEFAULT "now"(),
    "updated_at" "date",
    "import_price" numeric DEFAULT '0'::numeric,
    CONSTRAINT "batches_import_price_check" CHECK (("import_price" >= (0)::numeric)),
    CONSTRAINT "batches_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('pending'::character varying)::"text", ('available'::character varying)::"text", ('expired'::character varying)::"text", ('sold_out'::character varying)::"text"])))
);


ALTER TABLE "public"."batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "cart_item_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cart_id" "uuid",
    "product_id" "uuid",
    "quantity" integer NOT NULL,
    "note" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carts" (
    "cart_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "category_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "image_url" "text",
    "created_at" "date" DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."complaints" (
    "complaint_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "order_id" "uuid",
    "type" character varying(30) NOT NULL,
    "description" "text" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "reject_reason" "text",
    CONSTRAINT "complaints_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'resolved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."complaints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliveries" (
    "delivery_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid",
    "employee_id" "uuid",
    "status" character varying(20) DEFAULT 'assigned'::character varying,
    "pickup_time" timestamp with time zone,
    "delivery_time" timestamp with time zone,
    "note" "text",
    CONSTRAINT "deliveries_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['assigned'::character varying, 'picked_up'::character varying, 'delivering'::character varying, 'delivered'::character varying])::"text"[])))
);


ALTER TABLE "public"."deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_buy_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "quantity" integer NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_buy_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_buys" (
    "group_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid",
    "leader_id" "uuid",
    "target_quantity" integer NOT NULL,
    "current_quantity" integer DEFAULT 0,
    "min_quantity" integer NOT NULL,
    "discount_price" numeric(10,2),
    "deadline" timestamp with time zone NOT NULL,
    "status" character varying(20) DEFAULT 'open'::character varying,
    CONSTRAINT "group_buys_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['open'::character varying, 'success'::character varying, 'failed'::character varying, 'closed'::character varying])::"text"[])))
);


ALTER TABLE "public"."group_buys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "inventory_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "batch_id" "uuid",
    "quantity_available" integer NOT NULL,
    "quantity_reserved" integer DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_transactions" (
    "transaction_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "batch_id" "uuid",
    "type" character varying(20) NOT NULL,
    "quantity" integer NOT NULL,
    "note" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "order_item_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid",
    "product_id" "uuid",
    "batch_id" "uuid",
    "quantity" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "note" character varying
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "order_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "order_date" timestamp with time zone DEFAULT "now"(),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "total_amount" numeric(10,2) NOT NULL,
    "delivery_address" character varying(255) NOT NULL,
    "delivery_fee" numeric(10,2) DEFAULT 0,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" "date",
    CONSTRAINT "orders_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'preparing'::character varying, 'delivering'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "payment_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid",
    "method" character varying(30) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "amount" numeric(10,2) NOT NULL,
    "transaction_id" character varying(255),
    "payment_date" timestamp with time zone,
    CONSTRAINT "payments_method_check" CHECK ((("method")::"text" = ANY ((ARRAY['cod'::character varying, 'momo'::character varying, 'vnpay'::character varying, 'bank_transfer'::character varying])::"text"[]))),
    CONSTRAINT "payments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_interactions" (
    "interaction_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "user_id" "uuid",
    "type" character varying NOT NULL,
    "comment" "text",
    "created_at" "date" DEFAULT "now"(),
    "status" character varying
);


ALTER TABLE "public"."post_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_medias" (
    "media_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "media_url" "text"
);


ALTER TABLE "public"."post_medias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "post_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" character varying(200) NOT NULL,
    "content" "text" NOT NULL,
    "type" character varying(20) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "posts_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[]))),
    CONSTRAINT "posts_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['blog'::character varying, 'video'::character varying, 'community'::character varying])::"text"[])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prices" (
    "price_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "batch_id" "uuid",
    "price" numeric(10,2) NOT NULL,
    "date" "date" NOT NULL,
    "created_at" "date" DEFAULT "now"(),
    "status" character varying,
    CONSTRAINT "prices_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('pending'::character varying)::"text", ('active'::character varying)::"text", ('inactive'::character varying)::"text"])))
);


ALTER TABLE "public"."prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "product_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category_id" "uuid",
    "name" character varying(150) NOT NULL,
    "description" "text",
    "unit" character varying(20) NOT NULL,
    "image_url" "text",
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "nutrition" "text",
    CONSTRAINT "products_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::"text"[])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "review_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "product_id" "uuid",
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "role_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "role_name" character varying(30) NOT NULL,
    "description" "text",
    "is_customer" boolean,
    "is_admin" boolean,
    "is_manager" boolean,
    "is_employee" boolean,
    "is_shipper" boolean
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stores" (
    "store_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(150) NOT NULL,
    "description" "text",
    "address" character varying(255) NOT NULL,
    "ward" character varying(100),
    "district" character varying(100),
    "city" character varying(100),
    "phone" character varying(20),
    "email" character varying(255),
    "manager_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "opening_time" time without time zone,
    "closing_time" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "stores_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'closed'::character varying])::"text"[])))
);


ALTER TABLE "public"."stores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "subscription_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "product_id" "uuid",
    "schedule" character varying(50) NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "start_date" "date" NOT NULL,
    "end_date" "date"
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "supplier_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(150) NOT NULL,
    "address" character varying(255) NOT NULL,
    "certificate" character varying(255),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "suppliers_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "user_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "role_id" "uuid" DEFAULT '24487f27-1ce7-403e-8bdc-71a9166a3a3b'::"uuid",
    "name" character varying(100) NOT NULL,
    "email" character varying(255) NOT NULL,
    "password" character varying(255) NOT NULL,
    "phone" character varying(20),
    "address" character varying(255),
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text",
    "store_id" "uuid",
    CONSTRAINT "users_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'banned'::character varying])::"text"[])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."batches"
    ADD CONSTRAINT "batches_pkey" PRIMARY KEY ("batch_id");



ALTER TABLE ONLY "public"."batches"
    ADD CONSTRAINT "batches_qr_code_key" UNIQUE ("qr_code");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("cart_item_id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("cart_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id");



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_pkey" PRIMARY KEY ("complaint_id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_pkey" PRIMARY KEY ("delivery_id");



ALTER TABLE ONLY "public"."group_buy_members"
    ADD CONSTRAINT "group_buy_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_buys"
    ADD CONSTRAINT "group_buys_pkey" PRIMARY KEY ("group_id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id");



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("transaction_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_item_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id");



ALTER TABLE ONLY "public"."post_interactions"
    ADD CONSTRAINT "post_interactions_pkey" PRIMARY KEY ("interaction_id");



ALTER TABLE ONLY "public"."post_medias"
    ADD CONSTRAINT "post_medias_pkey" PRIMARY KEY ("media_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("post_id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_pkey" PRIMARY KEY ("price_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("review_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_role_name_key" UNIQUE ("role_name");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("store_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_batches_product_id" ON "public"."batches" USING "btree" ("product_id");



CREATE INDEX "idx_inventory_batch_id" ON "public"."inventory" USING "btree" ("batch_id");



CREATE OR REPLACE TRIGGER "trg_batches_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."batches" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_batches"();



CREATE OR REPLACE TRIGGER "trg_broadcast_cart_items" AFTER INSERT OR DELETE OR UPDATE ON "public"."cart_items" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_cart_items"();



CREATE OR REPLACE TRIGGER "trg_broadcast_carts" AFTER INSERT OR DELETE OR UPDATE ON "public"."carts" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_carts"();



CREATE OR REPLACE TRIGGER "trg_broadcast_complaints" AFTER INSERT OR DELETE OR UPDATE ON "public"."complaints" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_complaints"();



CREATE OR REPLACE TRIGGER "trg_broadcast_deliveries" AFTER INSERT OR DELETE OR UPDATE ON "public"."deliveries" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_deliveries"();



CREATE OR REPLACE TRIGGER "trg_broadcast_group_buy_members" AFTER INSERT OR DELETE OR UPDATE ON "public"."group_buy_members" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_group_buy_members"();



CREATE OR REPLACE TRIGGER "trg_broadcast_group_buys" AFTER INSERT OR DELETE OR UPDATE ON "public"."group_buys" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_group_buys"();



CREATE OR REPLACE TRIGGER "trg_broadcast_orders" AFTER INSERT OR DELETE OR UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_orders"();



CREATE OR REPLACE TRIGGER "trg_broadcast_payments" AFTER INSERT OR DELETE OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_payments"();



CREATE OR REPLACE TRIGGER "trg_broadcast_posts" AFTER INSERT OR DELETE OR UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_posts"();



CREATE OR REPLACE TRIGGER "trg_broadcast_reviews" AFTER INSERT OR DELETE OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_reviews"();



CREATE OR REPLACE TRIGGER "trg_broadcast_subscriptions" AFTER INSERT OR DELETE OR UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_subscriptions"();



CREATE OR REPLACE TRIGGER "trg_inventory_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."inventory" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_inventory"();



CREATE OR REPLACE TRIGGER "trg_inventory_transactions_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."inventory_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_inventory_transactions"();



CREATE OR REPLACE TRIGGER "trg_prices_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."prices" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_prices"();



CREATE OR REPLACE TRIGGER "trg_products_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."fn_broadcast_products"();



ALTER TABLE ONLY "public"."batches"
    ADD CONSTRAINT "batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."batches"
    ADD CONSTRAINT "batches_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("supplier_id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("cart_id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id");



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id");



ALTER TABLE ONLY "public"."group_buy_members"
    ADD CONSTRAINT "group_buy_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."group_buys"("group_id");



ALTER TABLE ONLY "public"."group_buy_members"
    ADD CONSTRAINT "group_buy_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."group_buys"
    ADD CONSTRAINT "group_buys_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."group_buys"
    ADD CONSTRAINT "group_buys_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("batch_id");



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("batch_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("batch_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id");



ALTER TABLE ONLY "public"."post_interactions"
    ADD CONSTRAINT "post_interactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id");



ALTER TABLE ONLY "public"."post_interactions"
    ADD CONSTRAINT "post_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."post_medias"
    ADD CONSTRAINT "post_medias_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."prices"
    ADD CONSTRAINT "prices_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("batch_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("store_id");



CREATE POLICY "Users can insert their own posts" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."post_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_medias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."fn_broadcast_batches"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_batches"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_batches"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_cart_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_cart_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_cart_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_carts"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_carts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_carts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_complaints"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_complaints"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_complaints"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_deliveries"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_deliveries"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_deliveries"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_group_buy_members"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_group_buy_members"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_group_buy_members"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_group_buys"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_group_buys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_group_buys"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_inventory"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_inventory"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_inventory"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_inventory_transactions"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_inventory_transactions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_inventory_transactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_order_tracking"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_order_tracking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_order_tracking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_orders"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_orders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_orders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_payments"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_payments"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_payments"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_posts"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_posts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_posts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_prices"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_prices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_prices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_products"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_products"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_products"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_reviews"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_reviews"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_reviews"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_broadcast_subscriptions"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_broadcast_subscriptions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_broadcast_subscriptions"() TO "service_role";


















GRANT ALL ON TABLE "public"."batches" TO "anon";
GRANT ALL ON TABLE "public"."batches" TO "authenticated";
GRANT ALL ON TABLE "public"."batches" TO "service_role";



GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";



GRANT ALL ON TABLE "public"."carts" TO "anon";
GRANT ALL ON TABLE "public"."carts" TO "authenticated";
GRANT ALL ON TABLE "public"."carts" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."complaints" TO "anon";
GRANT ALL ON TABLE "public"."complaints" TO "authenticated";
GRANT ALL ON TABLE "public"."complaints" TO "service_role";



GRANT ALL ON TABLE "public"."deliveries" TO "anon";
GRANT ALL ON TABLE "public"."deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."group_buy_members" TO "anon";
GRANT ALL ON TABLE "public"."group_buy_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_buy_members" TO "service_role";



GRANT ALL ON TABLE "public"."group_buys" TO "anon";
GRANT ALL ON TABLE "public"."group_buys" TO "authenticated";
GRANT ALL ON TABLE "public"."group_buys" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_transactions" TO "anon";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."post_interactions" TO "anon";
GRANT ALL ON TABLE "public"."post_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."post_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."post_medias" TO "anon";
GRANT ALL ON TABLE "public"."post_medias" TO "authenticated";
GRANT ALL ON TABLE "public"."post_medias" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."prices" TO "anon";
GRANT ALL ON TABLE "public"."prices" TO "authenticated";
GRANT ALL ON TABLE "public"."prices" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."stores" TO "anon";
GRANT ALL ON TABLE "public"."stores" TO "authenticated";
GRANT ALL ON TABLE "public"."stores" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































