import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GardenServerView from "@/components/GardenServerView";

export default async function MyGardenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Temporary one-time fix for the legacy mature plants (updated to clear cache)
  const cacheBuster = "v=99";
  await supabase
    .from("goals")
    .update({ asset_url: `/tree sprites/5.png?${cacheBuster}` })
    .eq("id", "b28cc118-bf4d-437b-acdd-e2d971de2884")
    .eq("user_id", user.id);
    
  await supabase
    .from("goals")
    .update({ asset_url: `/tree sprites/6.png?${cacheBuster}` })
    .eq("id", "4719e6b2-dd1a-4524-9cf1-056bc677f6a5")
    .eq("user_id", user.id);

  return <GardenServerView targetUserId={user.id} />;
}
