export type CrudPreset = {
  primaryKey: string;
  idExample: string;
  insert: Record<string, unknown>;
  update: Record<string, unknown>;
};

export const TABLE_CRUD_PRESETS: Record<string, CrudPreset> = {
  roles: {
    primaryKey: "role_id",
    idExample: "",
    insert: {
      role_name: "",
      description: "",
    },
    update: {
      description: "",
    },
  },
  users: {
    primaryKey: "user_id",
    idExample: "",
    insert: {
      role_id: "",
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      status: "",
    },
    update: {
      phone: "",
      address: "",
      status: "",
    },
  },
  suppliers: {
    primaryKey: "supplier_id",
    idExample: "",
    insert: {
      name: "",
      address: "",
      certificate: "",
      status: "",
      description: "",
    },
    update: {
      status: "",
      description: "",
    },
  },
  categories: {
    primaryKey: "category_id",
    idExample: "",
    insert: {
      name: "",
      description: "",
    },
    update: {
      description: "",
    },
  },
  products: {
    primaryKey: "product_id",
    idExample: "",
    insert: {
      category_id: "",
      name: "",
      description: "",
      unit: "",
      image_url: "",
      status: "",
    },
    update: {
      description: "",
      status: "",
    },
  },
  batches: {
    primaryKey: "batch_id",
    idExample: "",
    insert: {
      product_id: "",
      supplier_id: "",
      harvest_date: "",
      expire_date: "",
      quantity: "",
      qr_code: "",
      status: "",
    },
    update: {
      quantity: "",
      status: "",
    },
  },
  inventory: {
    primaryKey: "inventory_id",
    idExample: "",
    insert: {
      batch_id: "",
      quantity_available: "",
      quantity_reserved: "",
    },
    update: {
      quantity_available: "",
      quantity_reserved: "",
    },
  },
  inventory_transactions: {
    primaryKey: "transaction_id",
    idExample: "",
    insert: {
      batch_id: "",
      type: "",
      quantity: "",
      note: "",
    },
    update: {
      note: "",
    },
  },
  prices: {
    primaryKey: "price_id",
    idExample: "",
    insert: {
      batch_id: "",
      price: "",
      date: "",
    },
    update: {
      price: "",
    },
  },
  carts: {
    primaryKey: "cart_id",
    idExample: "",
    insert: {
      user_id: "",
    },
    update: {
      updated_at: "",
    },
  },
  cart_items: {
    primaryKey: "cart_item_id",
    idExample: "",
    insert: {
      cart_id: "",
      product_id: "",
      quantity: "",
      note: "",
    },
    update: {
      quantity: "",
      note: "",
    },
  },
  orders: {
    primaryKey: "order_id",
    idExample: "",
    insert: {
      user_id: "",
      status: "",
      total_amount: "",
      delivery_address: "",
      delivery_fee: "",
      note: "",
    },
    update: {
      status: "",
      note: "",
    },
  },
  order_items: {
    primaryKey: "order_item_id",
    idExample: "",
    insert: {
      order_id: "",
      product_id: "",
      batch_id: "",
      quantity: "",
      price: "",
    },
    update: {
      quantity: "",
      price: "",
    },
  },
  payments: {
    primaryKey: "payment_id",
    idExample: "",
    insert: {
      order_id: "",
      method: "",
      status: "",
      amount: "",
      transaction_id: "",
    },
    update: {
      status: "",
      payment_date: "",
    },
  },
  deliveries: {
    primaryKey: "delivery_id",
    idExample: "",
    insert: {
      order_id: "",
      employee_id: "",
      status: "",
      note: "",
    },
    update: {
      status: "",
      pickup_time: "",
    },
  },
  complaints: {
    primaryKey: "complaint_id",
    idExample: "",
    insert: {
      user_id: "",
      order_id: "",
      type: "",
      description: "",
      status: "",
    },
    update: {
      status: "",
      resolved_at: "",
    },
  },
  subscriptions: {
    primaryKey: "subscription_id",
    idExample: "",
    insert: {
      user_id: "",
      product_id: "",
      schedule: "",
      status: "",
      start_date: "",
      end_date: "",
    },
    update: {
      schedule: "",
      status: "",
    },
  },
  posts: {
    primaryKey: "post_id",
    idExample: "",
    insert: {
      user_id: "",
      title: "",
      content: "",
      type: "",
      status: "",
    },
    update: {
      status: "",
      title: "",
    },
  },
  group_buys: {
    primaryKey: "group_id",
    idExample: "",
    insert: {
      product_id: "",
      leader_id: "",
      target_quantity: "",
      current_quantity: "",
      min_quantity: "",
      discount_price: "",
      deadline: "",
      status: "",
    },
    update: {
      current_quantity: "",
      status: "",
    },
  },
  group_buy_members: {
    primaryKey: "id",
    idExample: "",
    insert: {
      group_id: "",
      user_id: "",
      quantity: "",
    },
    update: {
      quantity: "",
    },
  },
  reviews: {
    primaryKey: "review_id",
    idExample: "",
    insert: {
      user_id: "",
      product_id: "",
      rating: "",
      comment: "",
    },
    update: {
      rating: "",
      comment: "",
    },
  },
};
