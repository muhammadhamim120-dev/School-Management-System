import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, GraduationCap } from "lucide-react";

const schools = [
  { name: "Greenwood Academy", plan: "Enterprise", students: 1240, status: "active" },
  { name: "Sunrise International", plan: "Pro", students: 860, status: "active" },
  { name: "Lincoln School District", plan: "Enterprise", students: 2100, status: "active" },
  { name: "Oakridge Prep", plan: "Starter", students: 320, status: "active" },
  { name: "Valley Christian", plan: "Pro", students: 670, status: "trial" },
  { name: "Harbor View Academy", plan: "Starter", students: 180, status: "active" },
];

export default function SuperAdminSchoolsPage() {
  return (
    <>
      <PageHeader
        title="Schools"
        description="Manage all organizations on the platform"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <Card key={school.name} className="group rounded-2xl p-5 lift">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted ring-1 ring-border/50">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{school.name}</h3>
                  <p className="text-xs text-muted-foreground">{school.plan} Plan</p>
                </div>
              </div>
              <Badge variant={school.status === "active" ? "default" : "secondary"}>
                {school.status}
              </Badge>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {school.students.toLocaleString()} students
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {Math.ceil(school.students * 0.15)} staff
              </span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
