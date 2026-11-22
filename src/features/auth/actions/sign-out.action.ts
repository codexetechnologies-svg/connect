'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signOutAction(): Promise<never> {
  (await cookies()).delete('cp_session');
  redirect('/login');
}
