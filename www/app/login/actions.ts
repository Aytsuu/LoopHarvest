'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function login() {
  const cookieStore = await cookies();
  cookieStore.set('fl_logged_in', 'true', { path: '/', maxAge: 86400 });
  redirect('/home');
}

export async function signup() {
  const cookieStore = await cookies();
  cookieStore.set('fl_logged_in', 'true', { path: '/', maxAge: 86400 });
  redirect('/home');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('fl_logged_in');
  redirect('/');
}
