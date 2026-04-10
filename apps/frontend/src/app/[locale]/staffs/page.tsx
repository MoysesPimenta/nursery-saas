'use client';

import { useParams } from 'next/navigation';
import { redirect } from 'next/navigation';

export default function StaffsRedirect() {
  const params = useParams();
  redirect(`/${params.locale}/employees`);
}
