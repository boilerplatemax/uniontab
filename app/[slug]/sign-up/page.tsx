import { Suspense } from 'react';
import { UnionMemberSignUp } from './union-member-signup';

export default function UnionSignUpPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense>
      <UnionMemberSignUp params={params} />
    </Suspense>
  );
}
