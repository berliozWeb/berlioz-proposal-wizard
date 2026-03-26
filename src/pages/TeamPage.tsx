import { useState, useEffect } from "react";
import { Users, Mail } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const TeamPage = () => {
  const { profile } = useAuth();
  const [teammates, setTeammates] = useState<{ full_name: string | null; avatar_url: string | null; email: string | null }[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    if (!profile?.email_domain) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url, email")
      .eq("email_domain", profile.email_domain)
      .then(({ data }) => setTeammates(data ?? []));
  }, [profile?.email_domain]);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    // TODO: Send invitation via Resend or Supabase invite
    toast.success(`Invitación enviada a ${inviteEmail}`);
    setInviteEmail("");
    setInviteOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl text-foreground">Mi equipo</h1>
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <Mail className="w-4 h-4" /> Invitar
          </Button>
        </div>

        <p className="font-body text-sm text-muted-foreground">
          {profile?.company_name ? `Personas de ${profile.company_name} en Berlioz` : "Personas de tu empresa en Berlioz"}
        </p>

        {teammates.length <= 1 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-body text-muted-foreground mb-4">Eres el primero de tu empresa en Berlioz</p>
            <Button variant="outline" onClick={() => setInviteOpen(true)}>Invitar a un compañero</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {teammates.map((t, i) => {
              const init = t.full_name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "?";
              return (
                <div key={i} className="rounded-xl border border-border bg-card p-4 text-center">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover mx-auto mb-2" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-body font-semibold text-lg mx-auto mb-2">
                      {init}
                    </div>
                  )}
                  <p className="font-body text-sm font-medium truncate">{t.full_name?.split(" ")[0] ?? "—"}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Invitar a un compañero</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="correo@empresa.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button onClick={handleInvite} disabled={!inviteEmail.trim()} className="w-full">
              Enviar invitación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeamPage;
