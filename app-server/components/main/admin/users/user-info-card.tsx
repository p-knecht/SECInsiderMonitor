'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from '@prisma/client';

/**
 * Renders a card containing information about a user (email, role, created/updated at, last login)
 *
 * @param {User} user - The user object to display information for
 * @returns {JSX.Element} - The rendered UserInfoCard component
 */
export default function UserInfoCard({ user }: { user: User }) {
  // definition of items to display in the card
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
    { label: 'Erstellt am:', value: user.createdAt.toLocaleString() },
    { label: 'Aktualisiert am:', value: user.updatedAt.toLocaleString() },
    {
      label: 'Letztes Login am:',
      value: user.lastLogin ? user.lastLogin.toLocaleString() : 'noch nie',
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
            <span className="text-gray-900 break-words min-w-0">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
