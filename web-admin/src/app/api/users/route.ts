import { withSentry } from "@/lib/with-sentry";
import { NextResponse } from "next/server";
import { userManagementFacade } from "../../../../backend/modules/users/facades/user-management.facade";
import { logger } from "@/lib/logger";
import {
  portalActor,
  managerStoreIds,
  assertEmployeeRoleId,
} from "../../../../backend/core/manager-scope";
import { createServiceRoleSupabaseClient } from "../../../../backend/core/supabase";
import { AppError } from "../../../../backend/core/errors";
import type { UserSummary } from "../../../../backend/modules/users/user-management.types";
import { storeUserRoleAllowed, assignedStoreMap, publicStoreIds } from "../../../../backend/core/store-user-scope.mjs";
import { verifiedUserAddress } from "../../../../backend/core/user-address.mjs";
import { resolveDeliveryAddress, LocationError } from "../../../../../packages/location/index.mjs";

export const GET = withSentry(async (request: Request) => {
  const actor = await portalActor(request);
  logger.info("List users attempt");

  const start = Date.now();
  const requestedStore = new URL(request.url).searchParams.get("storeId")?.trim() || null;
  if (requestedStore && !/^[0-9a-f-]{36}$/i.test(requestedStore)) throw new AppError("Invalid store", 400);
  const managerStores = actor.role === "manager" ? await managerStoreIds(actor.id) : [];
  if (actor.role === "manager" && requestedStore && !managerStores.includes(requestedStore))
    throw new AppError("Forbidden store", 403);

  let items: Array<UserSummary & { store_ids?: string[] }>;
  if (actor.role === "admin" && !requestedStore) {
    items = await userManagementFacade.listUsers();
  } else {
    const scopedStores = actor.role === "manager"
      ? requestedStore ? [requestedStore] : managerStores
      : [requestedStore!];
    if (!scopedStores.length) {
      items = [];
    } else {
      const db = createServiceRoleSupabaseClient();
      // Membership covers staff, deliveries cover assigned shippers, and orders
      // cover customers even when users.store_id is null (global user record).
      // All four lookups are filtered by store BEFORE user identities are loaded.
      // Supabase/PostgREST commonly caps a single response at 1,000 rows.
      // Fetch scoped relationship IDs in deterministic pages to avoid
      // silently dropping customers from large stores.
      const fetchRelationships = async (
        table: "store_members" | "orders" | "deliveries" | "users",
        columns: string,
        orderColumn: string,
        onlyActive = false,
      ): Promise<Array<Record<string, string>>> => {
        const rows: Array<Record<string, string>> = [];
        for (let page = 0; page < 80; page++) {
          const from = page * 500;
          let query = db.from(table).select(columns)
            .in("store_id", scopedStores)
            .order("store_id", { ascending: true })
            .order(orderColumn, { ascending: true })
            .range(from, from + 499);
          if (onlyActive) query = query.eq("status", "active");
          const { data, error } = await query;
          if (error) throw new AppError("Failed to load store relationship data", 503);
          rows.push(...((data ?? []) as Array<Record<string, string>>));
          if ((data ?? []).length < 500) return rows;
        }
        throw new AppError("Too many store-related records; use narrower store scope", 503);
      };
      const [memberRows, orderRows, deliveryRows, defaultRows] = await Promise.all([
        fetchRelationships("store_members", "user_id,store_id", "user_id", true),
        // Managers only manage personnel. Do not load customers via orders
        // or users.store_id just to hide them later on the UI.
        actor.role === "manager" ? Promise.resolve([]) : fetchRelationships("orders", "user_id,store_id", "order_id"),
        fetchRelationships("deliveries", "employee_id,store_id", "delivery_id"),
        actor.role === "manager" ? Promise.resolve([]) : fetchRelationships("users", "user_id,store_id", "user_id"),
      ]);
      const members = memberRows as Array<{user_id: string;store_id: string}>;
      const orders = orderRows as Array<{user_id: string;store_id: string}>;
      const deliveries = deliveryRows as Array<{employee_id: string;store_id: string}>;
      const defaults = defaultRows as Array<{user_id: string;store_id: string}>;
      const affiliations = assignedStoreMap(
        scopedStores,
        members, orders, deliveries, defaults,
      );
      const staffAffiliations = assignedStoreMap(scopedStores, members, [], [], []);
      const shipperAffiliations = assignedStoreMap(scopedStores, members, [], deliveries, []);
      const customerAffiliations = assignedStoreMap(scopedStores, [], orders, [], defaults);
      const ids = [...affiliations.keys()];
      items = [];
      for (let startIndex = 0; startIndex < ids.length; startIndex += 200) {
        const { data, error } = await db.from("users")
          .select("user_id,role_id,store_id,name,email,phone,address,status,created_at,image_url,roles(role_name,is_employee,is_customer,is_shipper,is_admin,is_manager)")
          .in("user_id", ids.slice(startIndex, startIndex + 200));
        if (error) throw new AppError("Failed to load store-scoped users", 503);
        for (const row of data ?? []) {
          const relation = row.roles as unknown as Record<string, unknown> | Record<string, unknown>[] | null;
          const role = Array.isArray(relation) ? relation[0] : relation;
          // Only Admin may view other managers/admins; Managers can view
          // employees, shippers and customers but mutate employees only.
          if (actor.role === "manager" && (role?.is_customer === true || !storeUserRoleAllowed(role))) continue;
          // A store-related order must never grant staff-management visibility
          // to an employee from another store.
          const visibleStores = role?.is_customer === true ? customerAffiliations
            : role?.is_shipper === true ? shipperAffiliations
            : role?.is_employee === true ? staffAffiliations
            : affiliations;
          const matchedStores = publicStoreIds(visibleStores, row.user_id);
          if (!matchedStores.length) continue;
          items.push({
            user_id: row.user_id,
            role_id: row.role_id,
            store_id: row.store_id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            status: row.status,
            created_at: row.created_at,
            image_url: row.image_url,
            role_name: typeof role?.role_name === "string" ? role.role_name : null,
            store_ids: matchedStores,
          } as UserSummary & { store_ids: string[] });
        }
      }
      items.sort((a,b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
  }

  logger.info("List users success", {
    count: items.length,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(
    {
      items,
      total: items.length,
    },
    { status: 200 },
  );
});

export const POST = withSentry(async (request: Request) => {
  const actor = await portalActor(request);
  const body = (await request.json()) as {
    roleId?: string | null;
    storeId?: string | null;
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    address?: string;
    locationHint?: {latitude:number;longitude:number};
    imageUrl?: string;
    status?: "active" | "inactive" | "banned";
  };

  if (actor.role === "manager") {
    await assertEmployeeRoleId(body.roleId);
    const stores = await managerStoreIds(actor.id);
    if (!body.storeId || !stores.includes(body.storeId))
      throw new AppError("Forbidden", 403);
  }

  logger.info("Create user attempt", {
    email: body.email,
  });

  const start = Date.now();

  // Geocoding is authoritative server-side; do not trust client-supplied lat/lng.
  let verified;
  try { verified = await verifiedUserAddress(body.address ?? "", resolveDeliveryAddress, body.locationHint); }
  catch (error) { throw new AppError(error instanceof Error ? error.message : "Invalid address", error instanceof LocationError ? error.status : 422); }

  const created = await userManagementFacade.createUser({
    roleId: body.roleId,
    storeId: body.storeId,
    name: body.name ?? "",
    email: body.email ?? "",
    password: body.password ?? "",
    phone: body.phone,
    address: verified.address,
    latitude: verified.latitude,
    longitude: verified.longitude,
    imageUrl: body.imageUrl,
    status: body.status,
  });

  if (actor.role === "manager" && body.storeId && body.roleId) {
    const { error } = await createServiceRoleSupabaseClient()
      .from("store_members")
      .upsert(
        {
          user_id: created.user_id,
          store_id: body.storeId,
          role_id: body.roleId,
          status: "active",
        },
        { onConflict: "store_id,user_id" },
      );
    if (error)
      throw new AppError(
        "User created but store membership failed; contact administrator",
        503,
      );
  }

  logger.info("Create user success", {
    userId: created.user_id,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json(created, { status: 201 });
});
