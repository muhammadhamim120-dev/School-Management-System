import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, avatarUrl } from "@/lib/utils";

const users = [
  { name: "Alice Johnson", email: "alice@greenwood.edu", role: "SCHOOL_ADMIN", school: "Greenwood Academy", status: "active" },
  { name: "Bob Williams", email: "bob@sunrise.edu", role: "TEACHER", school: "Sunrise International", status: "active" },
  { name: "Carol Davis", email: "carol@lincoln.edu", role: "SCHOOL_ADMIN", school: "Lincoln School District", status: "active" },
  { name: "David Chen", email: "david@oakridge.edu", role: "PARENT", school: "Oakridge Prep", status: "inactive" },
  { name: "Eva Martinez", email: "eva@valley.edu", role: "TEACHER", school: "Valley Christian", status: "active" },
  { name: "Frank Brown", email: "frank@harbor.edu", role: "SCHOOL_ADMIN", school: "Harbor View Academy", status: "active" },
];

export default function SuperAdminUsersPage() {
  return (
    <>
      <PageHeader
        title="Users"
        description="Global user management across all schools"
      />

      <Card className="rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">School</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {users.map((user) => (
                <tr key={user.email} className="transition-colors hover:bg-accent/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl(user.name)} alt={user.name} />
                        <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline">{user.role.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{user.school}</td>
                  <td className="px-5 py-3">
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>
                      {user.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
