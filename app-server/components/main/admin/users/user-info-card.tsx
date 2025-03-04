import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from '@prisma/client';

export default function UserInfoCard({ user }: { user: User }) {
  const infoItems = [
    { label: 'E-Mail:', value: user.email },
    {
      label: 'Rolle:',
      value: (
        <Badge
          variant="secondary"
          className={user.role.toLowerCase() === 'admin' ? 'bg-red-200' : 'bg-blue-200'}
        >
          {user.role.toUpperCase()}
        </Badge>
      ),
    },
    { label: 'Erstellt am:', value: new Date(user.createdAt).toLocaleString() },
    { label: 'Aktualisiert am:', value: new Date(user.updatedAt).toLocaleString() },
    {
      label: 'Letztes Login am:',
      value: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'noch nie',
    },
  ];

  return (
    <Card className="border shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Benutzerinformationen</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {infoItems.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-4">
            <span className="w-32 font-medium text-gray-400">{label}</span>
            <span className="text-gray-900 break-all min-w-0">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
