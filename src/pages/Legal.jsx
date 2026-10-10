import { Container } from '../ui';

const H = ({ children }) => <h2 className="mt-8 text-2xl font-extrabold">{children}</h2>;
const P = ({ children }) => <p className="mt-2 text-mute">{children}</p>;

export default function Legal() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="rounded-xl bg-pepper/10 p-4 text-sm font-semibold text-pepper">DRAFT. Have a Nigerian lawyer review and edit this page before you launch.</p>
      <h1 className="mt-6 text-4xl font-extrabold">Terms, refunds and privacy</h1>

      <H>1. What GbaanJo is</H>
      <P>GbaanJo is a marketplace where food businesses and shops list food and groceries at reduced prices, and buyers reserve and pay for them. GbaanJo does not make, store or deliver the food. Each seller is responsible for the food they list, including how it was prepared and stored, and for being honest about it.</P>

      <H>2. Buying</H>
      <P>You pay online through Paystack when you reserve. Your food is held for a short time while you pay. After payment you get a 6-digit pickup code, the seller's address and phone number. You must collect the food before the pickup deadline and show your code. Please check the food before you leave and do not consume anything that looks or smells wrong. A small service fee is added at checkout. Anyone who shows your pickup code can collect your order.</P>

      <H>3. Refunds</H>
      <P>You can cancel for a full refund while the sale is still open. If a seller cancels, or GbaanJo removes a listing, you are refunded in full. If you do not collect your food before the pickup deadline, the order is treated as a no-show and is not refunded. Repeated no-shows can lead to your reservations being paused. Refunds are processed within 1 to 3 working days to the original payment method.</P>

      <H>4. Selling</H>
      <P>Sellers must set up a payout bank account. When a buyer pays, Paystack sends the seller's share to that account and GbaanJo keeps a service fee, shown when you create a listing. Sellers must only list food that is safe to eat, describe it honestly, and hand it over when the buyer shows their code. GbaanJo can remove listings and suspend accounts that break these rules. Sellers must be registered with the Corporate Affairs Commission and give us their registration number, which we check before they can list.</P>

      <H>5. Your information</H>
      <P>We collect your name, email, phone number and, for sellers, bank details, to run your account, process orders and keep the platform safe. Payment details are handled by Paystack and are never stored by GbaanJo. We share your name and phone number with the other side of an order only so you can complete pickup. We do not sell your information.</P>

      <H>6. Contact</H>
      <P>Add your support email and phone number here before launch.</P>
    </div>
  );
}
