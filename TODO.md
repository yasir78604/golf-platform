# TODO

## Subscription: remove admin-approval gate
- [x] Update `frontend/src/components/SubscriptionGuard.jsx` so `pending` no longer redirects to `payment-success`; instead allow access only when `subscription_status === 'active'`.

- [x] Update `frontend/src/pages/PaymentSuccess.jsx` copy/messages to remove “admin approval” wording.
- [x] Run frontend build (backend dev server runs) and verify redirect logic is consistent.



