import BaseLayout from "@/components/layout/BaseLayout";

const TeamPage = () => (
  <BaseLayout>
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="font-heading text-3xl text-foreground mb-2">Mi equipo</h1>
      <p className="font-body text-muted-foreground">Gestiona los miembros de tu equipo.</p>
    </div>
  </BaseLayout>
);

export default TeamPage;