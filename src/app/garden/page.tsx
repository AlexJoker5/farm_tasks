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

  return <GardenServerView targetUserId={user.id} />;
}
