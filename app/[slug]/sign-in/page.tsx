import { Suspense } from 'react';
import { UnionMemberSignIn } from './union-member-signin';

export default function UnionSignInPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense>
      <UnionMemberSignIn params={params} />
    </Suspense>
  );
}
