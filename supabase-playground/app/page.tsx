"use client";

import { useState } from "react";
import { allOperations } from "@/lib/supabaseExamples";

interface OperationField {
  name: string;
  type: string;
  required: boolean;
  example?: string;
}

interface Operation {
  description: string;
  query?: string;
  inputFields?: OperationField[];
  expectedReturn?: any;
  execute: (...args: any[]) => Promise<any>;
}

const tableShowcase = [
  {
    section: "1. Identity & Access Management",
    tables: [
      { name: "roles", desc: "Role definitions (admin, manager, employee, customer)" },
      { name: "users", desc: "User profiles and account data" },
    ],
  },
  {
    section: "2. Supply Chain & Products",
    tables: [
      { name: "suppliers", desc: "Farm/supplier information" },
      { name: "categories", desc: "Product categories" },
      { name: "products", desc: "Product catalog" },
      { name: "batches", desc: "Product lots with harvest/expiry dates" },
    ],
  },
  {
    section: "3. Inventory & Pricing",
    tables: [
      { name: "inventory", desc: "Current stock by batch" },
      { name: "inventory_transactions", desc: "Stock in/out/adjustment history" },
      { name: "prices", desc: "Price history by date/batch" },
    ],
  },
  {
    section: "4. Shopping & Orders",
    tables: [
      { name: "carts", desc: "User carts" },
      { name: "cart_items", desc: "Items inside carts" },
      { name: "orders", desc: "Customer orders" },
      { name: "order_items", desc: "Line items in each order" },
      { name: "order_tracking", desc: "Order status timeline" },
    ],
  },
  {
    section: "5. Fulfillment, Social & Extras",
    tables: [
      { name: "payments", desc: "Payment records and status" },
      { name: "deliveries", desc: "Delivery assignment and lifecycle" },
      { name: "complaints", desc: "Complaints and return requests" },
      { name: "subscriptions", desc: "Recurring purchases" },
      { name: "posts", desc: "Community/blog/video posts" },
      { name: "group_buys", desc: "Group-buy campaigns" },
      { name: "group_buy_members", desc: "Members in each group-buy" },
      { name: "reviews", desc: "Product reviews" },
    ],
  },
];

export default function SupabasePlayground() {
  const [selectedCategory, setSelectedCategory] = useState<string>("products");
  const [selectedOperation, setSelectedOperation] = useState<string>("select");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = Object.keys(allOperations);
  const currentOps = allOperations[selectedCategory as keyof typeof allOperations] || {};
  const operationNames = Object.keys(currentOps);
  
  const currentOp = currentOps[selectedOperation as keyof typeof currentOps] as Operation;

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleExecute = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare arguments based on input fields
      const args = currentOp.inputFields?.map(field => inputs[field.name] || "") || [];

      const response = await currentOp.execute(...args);
      setResult(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🧪 Supabase GreenPlus Playground</h1>
          <p className="text-slate-400">Test all Supabase operations with live data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-3 text-emerald-400">📚 Categories</h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        const ops = allOperations[cat as keyof typeof allOperations];
                        setSelectedOperation(Object.keys(ops)[0]);
                        setInputs({});
                        setResult(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded transition ${
                        selectedCategory === cat
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Operations List */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-emerald-400">{selectedCategory}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {operationNames.map(opName => (
                  <button
                    key={opName}
                    onClick={() => {
                      setSelectedOperation(opName);
                      setInputs({});
                      setResult(null);
                    }}
                    className={`px-3 py-2 rounded text-sm transition ${
                      selectedOperation === opName
                        ? "bg-blue-500 text-white"
                        : "bg-slate-600 hover:bg-slate-500 text-slate-200"
                    }`}
                  >
                    {opName}
                  </button>
                ))}
              </div>
            </div>

            {/* Operation Details */}
            {currentOp && (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-slate-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2 text-blue-400">📋 Operation</h3>
                  <p className="text-slate-300 mb-4">{currentOp.description}</p>

                  {currentOp.query && (
                    <div className="bg-slate-800 rounded p-3 text-slate-300 text-sm overflow-x-auto">
                      <pre>{currentOp.query}</pre>
                    </div>
                  )}
                </div>

                {/* Input Fields */}
                {currentOp.inputFields && currentOp.inputFields.length > 0 && (
                  <div className="bg-slate-700 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-green-400">📝 Input (POST/INSERT)</h3>
                    <div className="space-y-3">
                      {currentOp.inputFields.map(field => (
                        <div key={field.name}>
                          <label className="block text-sm font-semibold text-slate-200 mb-1">
                            {field.name}
                            {field.required && <span className="text-red-400">*</span>}
                            <span className="text-xs text-slate-400 ml-2">({field.type})</span>
                          </label>
                          <input
                            type="text"
                            value={inputs[field.name] || ""}
                            onChange={e => handleInputChange(field.name, e.target.value)}
                            placeholder={field.example || `Enter ${field.name}`}
                            className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expected Return */}
                {currentOp.expectedReturn && (
                  <div className="bg-slate-700 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-purple-400">📤 Expected Return (SELECT)</h3>
                    <div className="bg-slate-800 rounded p-3 text-slate-300 text-sm overflow-x-auto">
                      <pre>{JSON.stringify(currentOp.expectedReturn, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Execute Button */}
                <button
                  onClick={handleExecute}
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-bold text-lg transition ${
                    loading
                      ? "bg-slate-600 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                  }`}
                >
                  {loading ? "⏳ Executing..." : "▶ Execute Operation"}
                </button>

                {/* Results */}
                {result && (
                  <div className="bg-slate-700 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-yellow-400">✅ Result</h3>
                    {result.error ? (
                      <div className="bg-red-900 border border-red-700 rounded p-3">
                        <p className="font-bold text-red-200">Error:</p>
                        <pre className="text-red-100 text-sm overflow-x-auto">
                          {JSON.stringify(result.error, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-slate-800 rounded p-3 text-slate-300 text-sm overflow-x-auto max-h-96">
                        <pre>{JSON.stringify(result.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Errors */}
                {error && (
                  <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                    <p className="text-red-200">
                      <span className="font-bold">❌ Error:</span> {error}
                    </p>
                  </div>
                )}
              </div>
            )}


            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-cyan-400">📖 Quick Reference</h3>
              <div className="text-slate-300 text-sm space-y-2">
                <p>
                  <span className="font-bold">GET/SELECT:</span> Retrieve data - returns array of objects
                </p>
                <p>
                  <span className="font-bold">POST/INSERT:</span> Add new data - provide all required fields (marked with *)
                </p>
                <p>
                  <span className="font-bold">PUT/UPDATE:</span> Modify existing - provide ID and fields to change
                </p>
                <p>
                  <span className="font-bold">DELETE:</span> Remove data - provide ID to delete
                </p>
                <p className="text-slate-400 mt-3">
                  👉 Tip: Check the "Expected Return" section to see what data structure you'll get back
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
