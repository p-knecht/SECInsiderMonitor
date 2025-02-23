import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';

const TestPage = async () => {
  const session = await auth();
  return (
    <div>
      {JSON.stringify(session)}
      <form
        action={async () => {
          'use server';
          await signOut({ redirect: false });
          redirect('/auth/login');
        }}
      >
        <button type="submit">Abmelden</button>
      </form>
    </div>
  );
};

export default TestPage;
