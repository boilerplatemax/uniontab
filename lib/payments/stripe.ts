import Stripe from "stripe"
import { redirect } from "next/navigation"
import { Union } from "@/lib/db/schema"
import {
  getTeamByStripeCustomerId,
  getUser,
  updateTeamSubscription,
} from "@/lib/db/queries"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // API version must match the installed stripe package version in pnpm-lock.yaml.
  // Currently pinned to stripe@18.1.0 → "2025-04-30.basil".
  // If you upgrade stripe, update this string to match the new package's expected version.
  // @ts-ignore - Local node_modules may have a newer stripe version than the lockfile; Vercel uses the lockfile.
  apiVersion: "2025-04-30.basil",
})

export async function createCheckoutSession({
  team,
  priceId,
}: {
  team: Union | null
  priceId: string
}) {
  const user = await getUser()

  if (!team || !user) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`)
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
        adjustable_quantity: {
          enabled: false,
        },
      },
    ],
    mode: "subscription",
    success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
    customer: team.stripeCustomerId || undefined,
    client_reference_id: user.id.toString(),
    allow_promotion_codes: true,
  })

  redirect(session.url!)
}

export async function createCustomerPortalSession(union: Union) {
  if (!union.stripeCustomerId || !union.stripeProductId) {
    redirect("/pricing")
  }

  let configuration: Stripe.BillingPortal.Configuration
  let configurations: Stripe.ApiList<Stripe.BillingPortal.Configuration>

  try {
    configurations = await stripe.billingPortal.configurations.list()
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Failed to list portal configurations:', error.message)
      throw new Error('Unable to access billing portal. Please try again later.')
    }
    throw error
  }

  if (configurations.data.length > 0) {
    configuration = configurations.data[0]
  } else {
    const product = await stripe.products.retrieve(union.stripeProductId)
    if (!product.active) {
      throw new Error("Union's product is not active in Stripe")
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
    })
    if (prices.data.length === 0) {
      throw new Error("No active prices found for the union's product")
    }

    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "Manage your subscription",
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ["price", "promotion_code"],
          proration_behavior: "create_prorations",
          products: [
            {
              product: product.id,
              prices: prices.data.map((price) => price.id),
            },
          ],
        },
        subscription_cancel: {
          enabled: true,
          mode: "at_period_end",
          cancellation_reason: {
            enabled: true,
            options: [
              "too_expensive",
              "missing_features",
              "switched_service",
              "unused",
              "other",
            ],
          },
        },
        payment_method_update: {
          enabled: true,
        },
      },
    })
  }

  try {
    return await stripe.billingPortal.sessions.create({
      customer: union.stripeCustomerId,
      return_url: `${process.env.BASE_URL}/${union.slug}/billing`,
      configuration: configuration.id,
    })
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'resource_missing') {
        throw new Error('Customer not found in billing system. Please contact support.')
      }
      console.error('Failed to create portal session:', error.message)
      throw new Error('Unable to open billing portal. Please try again later.')
    }
    throw error
  }
}

export async function changeSubscriptionPlan(union: Union, newPriceId: string) {
  if (!union.stripeSubscriptionId) {
    throw new Error("No active subscription to update")
  }

  // First, verify the subscription exists and is in a valid state
  let subscription: Stripe.Subscription
  try {
    subscription = await stripe.subscriptions.retrieve(union.stripeSubscriptionId)
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'resource_missing') {
        // Subscription doesn't exist in Stripe - clear it from database
        await updateTeamSubscription(union.id, {
          stripeSubscriptionId: null,
          stripeProductId: null,
          planName: null,
          subscriptionStatus: "canceled",
        })
        throw new Error("Subscription not found. It may have been canceled externally. Please subscribe to a new plan.")
      }
      throw new Error(`Failed to retrieve subscription: ${error.message}`)
    }
    throw error
  }

  // Check if subscription is in a valid state for changes
  if (subscription.status === 'canceled') {
    // Clear the invalid subscription from database
    await updateTeamSubscription(union.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: "canceled",
    })
    throw new Error("This subscription has been canceled. Please subscribe to a new plan.")
  }

  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    throw new Error(`Cannot change plan: subscription is ${subscription.status}. Please resolve any payment issues first.`)
  }

  const currentItemId = subscription.items.data[0]?.id

  if (!currentItemId) {
    throw new Error("No subscription item found")
  }

  // Update the subscription with the new price
  let updatedSubscription: Stripe.Subscription
  try {
    updatedSubscription = await stripe.subscriptions.update(union.stripeSubscriptionId, {
      items: [
        {
          id: currentItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: "create_prorations",
    })
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'resource_missing') {
        throw new Error("The selected plan is no longer available. Please refresh and try again.")
      }
      throw new Error(`Failed to update subscription: ${error.message}`)
    }
    throw error
  }

  // Get the new product info - handle both string and expanded object cases
  let productId: string
  let productName: string

  const newPrice = await stripe.prices.retrieve(newPriceId, {
    expand: ["product"],
  })

  if (typeof newPrice.product === "string") {
    // Product was not expanded, fetch it separately
    productId = newPrice.product
    const product = await stripe.products.retrieve(newPrice.product)
    productName = product.name
  } else if ("deleted" in newPrice.product && newPrice.product.deleted) {
    // Product is deleted, use the ID and a fallback name
    productId = newPrice.product.id
    productName = "Subscription Plan"
  } else {
    // Product is expanded and not deleted
    productId = newPrice.product.id
    productName = newPrice.product.name
  }

  // Update the database with new plan info
  await updateTeamSubscription(union.id, {
    stripeSubscriptionId: union.stripeSubscriptionId,
    stripeProductId: productId,
    planName: productName,
    subscriptionStatus: updatedSubscription.status as "active" | "trialing" | "canceled" | "unpaid",
  })

  return updatedSubscription
}

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id
  const status = subscription.status

  const union = await getTeamByStripeCustomerId(customerId)

  if (!union) {
    console.error("Union not found for Stripe customer:", customerId)
    return
  }

  try {
    if (status === "active" || status === "trialing") {
      const plan = subscription.items.data[0]?.plan

      // Get product ID and name - product can be either a string ID or expanded object
      let productId: string | null = null
      let productName: string | null = null

      if (plan?.product) {
        if (typeof plan.product === "string") {
          // Product is not expanded, fetch the product details
          productId = plan.product
          try {
            const product = await stripe.products.retrieve(plan.product)
            productName = product.name
          } catch (productError) {
            console.error("Failed to fetch product details:", productError)
            productName = "Subscription Plan" // Fallback name
          }
        } else if (!("deleted" in plan.product) || !plan.product.deleted) {
          // Product is expanded and not deleted
          productId = plan.product.id
          productName = plan.product.name
        } else {
          // Product is deleted, just use the ID
          productId = plan.product.id
          productName = "Subscription Plan" // Fallback for deleted product
        }
      }

      await updateTeamSubscription(union.id, {
        stripeSubscriptionId: subscriptionId,
        stripeProductId: productId,
        planName: productName,
        subscriptionStatus: status,
      })
    } else if (status === "canceled" || status === "unpaid") {
      await updateTeamSubscription(union.id, {
        stripeSubscriptionId: null,
        stripeProductId: null,
        planName: null,
        subscriptionStatus: status,
      })
    }
  } catch (error) {
    console.error("Error updating subscription in database:", error)
    throw error // Re-throw to allow webhook to handle retry
  }
}

export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ["data.product"],
    active: true,
    type: "recurring",
  })

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === "string" ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    trialPeriodDays: price.recurring?.trial_period_days,
  }))
}

export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
  })

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === "string"
        ? product.default_price
        : product.default_price?.id,
  }))
}

export async function cancelSubscription(union: Union) {
  if (!union.stripeSubscriptionId) {
    throw new Error("No active subscription to cancel")
  }

  // First, verify the subscription exists and check its status
  let existingSubscription: Stripe.Subscription
  try {
    existingSubscription = await stripe.subscriptions.retrieve(union.stripeSubscriptionId)
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'resource_missing') {
        // Subscription doesn't exist in Stripe - clean up database
        await updateTeamSubscription(union.id, {
          stripeSubscriptionId: null,
          stripeProductId: null,
          planName: null,
          subscriptionStatus: "canceled",
        })
        // Don't throw error - just return as if canceled successfully
        console.log(`Subscription ${union.stripeSubscriptionId} not found in Stripe, cleaned up database`)
        return null
      }
      throw new Error(`Failed to retrieve subscription: ${error.message}`)
    }
    throw error
  }

  // If already canceled, just update the database
  if (existingSubscription.status === 'canceled') {
    await updateTeamSubscription(union.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: "canceled",
    })
    return existingSubscription
  }

  // Cancel the subscription immediately
  let canceledSubscription: Stripe.Subscription
  try {
    canceledSubscription = await stripe.subscriptions.cancel(
      union.stripeSubscriptionId
    )
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Failed to cancel subscription: ${error.message}`)
    }
    throw error
  }

  // Update the database to reflect cancellation
  await updateTeamSubscription(union.id, {
    stripeSubscriptionId: null,
    stripeProductId: null,
    planName: null,
    subscriptionStatus: "canceled",
  })

  return canceledSubscription
}
