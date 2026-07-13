import axios from 'axios';

/**
 * Cashfree PG order-token helper (parity with `brifix_investors_frontend/src/api/paymentService.js`).
 *
 * Important: embedding `NEXT_PUBLIC_*` secrets exposes them to the browser. For production,
 * move token creation to a Next.js Route Handler or your Python backend and call that instead.
 */
const CASHFREE_PG_ORDERS_URL =
  process.env.NEXT_PUBLIC_CASHFREE_PG_URL ?? 'https://sandbox.cashfree.com/pg/orders';

export type CashfreeCustomerDetails = {
  customerId: string;
  name: string;
  email: string;
  phone: string;
};

export async function generateCashfreeOrderToken(
  orderId: string,
  amount: number,
  customerDetails: CashfreeCustomerDetails
): Promise<string> {
  const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
  const secretKey = process.env.NEXT_PUBLIC_CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error(
      'Cashfree env missing: set NEXT_PUBLIC_CASHFREE_APP_ID and NEXT_PUBLIC_CASHFREE_SECRET_KEY (or create tokens server-side).'
    );
  }

  const response = await axios.post<{ order_token: string }>(
    CASHFREE_PG_ORDERS_URL,
    {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerDetails.customerId,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone,
      },
    },
    {
      headers: {
        'x-api-version': '2022-09-01',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.order_token;
}
