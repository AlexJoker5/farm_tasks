"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function purchaseItem(itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Call the secure RPC function
  const { data, error } = await supabase.rpc("purchase_item", {
    p_item_id: itemId,
  });

  if (error) {
    console.error("Purchase error:", error);
    return { error: "Failed to process purchase" };
  }

  if (data?.error) {
    return { error: data.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/shop");
  
  return { success: true, newBalance: data.new_balance };
}
