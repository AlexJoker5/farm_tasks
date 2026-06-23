import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ShopClient from "@/components/ShopClient";

export default async function ShopPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's currency balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("currency_balance")
    .eq("id", user.id)
    .single();

  // Fetch shop catalog
  const { data: items } = await supabase
    .from("shop_items")
    .select("*")
    .order("price", { ascending: true });

  // Fetch user's inventory
  const { data: inventory } = await supabase
    .from("inventory")
    .select(`
      item_id,
      quantity,
      shop_items (
        name,
        texture_key,
        item_type
      )
    `)
    .eq("user_id", user.id);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-green)] to-[var(--accent-cyan)] flex items-center justify-center">
              <span className="text-sm">🌱</span>
            </div>
            <span className="pixel-text text-[10px] text-[var(--text-primary)]">
              Farm Tasks
            </span>
          </Link>
          <span className="text-[var(--text-muted)]">→</span>
          <span className="pixel-text-sm text-[var(--text-secondary)]">
            Shop
          </span>
        </div>

        <Link
          href="/dashboard"
          className="btn-secondary !py-2 !px-4 !text-[0.5rem]"
        >
          ← Dashboard
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        <ShopClient
          items={items ?? []}
          inventory={inventory ?? []}
          initialBalance={profile?.currency_balance ?? 0}
        />
      </main>
    </div>
  );
}
