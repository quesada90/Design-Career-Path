import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import App from '../src/app/App';

export default async function HomePage() {
  const { userId } = await auth();

  // If not logged in, redirect to sign-in
  if (!userId) {
    redirect('/sign-in');
  }

  return <App />;
}
