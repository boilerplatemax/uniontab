'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession, changeSubscriptionPlan } from './stripe';
import { withTeam } from '@/lib/auth/middleware';

export const checkoutAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string;
  await createCheckoutSession({ team: team, priceId });
});

export const customerPortalAction = withTeam(async (_, team) => {
  const portalSession = await createCustomerPortalSession(team);
  redirect(portalSession.url);
});

export const changePlanAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string;

  if (!priceId || priceId.trim() === '') {
    throw new Error('Invalid price ID');
  }

  if (!team.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  await changeSubscriptionPlan(team, priceId);

  // Store the slug before redirect to ensure it's captured
  const redirectUrl = `/${team.slug}/billing`;
  redirect(redirectUrl);
});
