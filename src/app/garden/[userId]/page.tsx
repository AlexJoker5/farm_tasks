import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GardenServerView from "@/components/GardenServerView";

export default async function GardenPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is visiting their own garden via the ID route, redirect to the clean /garden route
  if (user && user.id === userId) {
    redirect("/garden");
  }

  return <GardenServerView targetUserId={userId} />;
}
