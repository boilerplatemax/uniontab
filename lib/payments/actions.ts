'use server';

import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { createCheckoutSession, createCustomerPortalSession, changeSubscriptionPlan, cancelSubscription } from './stripe';
import { withTeam } from '@/lib/auth/middleware';

export const checkoutAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string;

  if (!priceId || priceId.trim() === '') {
    throw new Error('Invalid price ID');
  }

  try {
    await createCheckoutSession({ team: team, priceId });
  } catch (error) {
    // Re-throw redirect errors - they're intentional
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Checkout session error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create checkout session');
  }
});

export const customerPortalAction = withTeam(async (_, team) => {
  try {
    const portalSession = await createCustomerPortalSession(team);
    redirect(portalSession.url);
  } catch (error) {
    // Re-throw redirect errors - they're intentional
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Customer portal error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to open billing portal');
  }
});

export const changePlanAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string;

  if (!priceId || priceId.trim() === '') {
    throw new Error('Invalid price ID');
  }

  if (!team.stripeSubscriptionId) {
    throw new Error('No active subscription found. Please subscribe to a plan first.');
  }

  try {
    console.log(`Attempting to change plan for team ${team.id} to price ${priceId}`);
    await changeSubscriptionPlan(team, priceId);
    console.log(`Successfully changed plan for team ${team.id}`);
  } catch (error) {
    // Re-throw redirect errors - they're intentional
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Change plan error:', error);
    // Provide more specific error message
    if (error instanceof Error) {
      // Pass through errors from our improved Stripe handling
      if (error.message.includes('Subscription not found') ||
          error.message.includes('subscription has been canceled') ||
          error.message.includes('Cannot change plan') ||
          error.message.includes('plan is no longer available') ||
          error.message.includes('Failed to')) {
        throw error;
      }
      if (error.message.includes('No such price')) {
        throw new Error('Invalid plan selected. Please refresh the page and try again.');
      }
      if (error.message.includes('No such subscription')) {
        throw new Error('Subscription not found. It may have been canceled. Please refresh the page.');
      }
      throw new Error(error.message);
    }
    throw new Error('Failed to change plan. Please try again.');
  }

  // Store the slug before redirect to ensure it's captured
  const redirectUrl = `/${team.slug}/billing`;
  redirect(redirectUrl);
});

export const cancelSubscriptionAction = withTeam(async (_, team) => {
  if (!team.stripeSubscriptionId) {
    throw new Error('No active subscription to cancel');
  }

  try {
    console.log(`Attempting to cancel subscription for team ${team.id}`);
    await cancelSubscription(team);
    console.log(`Successfully processed cancellation for team ${team.id}`);
  } catch (error) {
    // Re-throw redirect errors - they're intentional
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Cancel subscription error:', error);
    if (error instanceof Error) {
      // Pass through errors from our improved Stripe handling
      if (error.message.includes('Failed to')) {
        throw error;
      }
      if (error.message.includes('No such subscription')) {
        throw new Error('Subscription not found. It may have already been canceled.');
      }
      throw new Error(error.message);
    }
    throw new Error('Failed to cancel subscription. Please try again.');
  }

  // Redirect back to billing page after cancellation
  const redirectUrl = `/${team.slug}/billing`;
  redirect(redirectUrl);
});
