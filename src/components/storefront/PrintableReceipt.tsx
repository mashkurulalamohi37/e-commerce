import { type OrderRecord } from "@/lib/order-api";
import { taka, BRAND_NAME } from "@/lib/catalog";

interface PrintableReceiptProps {
  order: OrderRecord;
}

export function PrintableReceipt({ order }: PrintableReceiptProps) {
  return (
    <div className="hidden print:block print:bg-white print:text-black print:p-8 print:w-full print:max-w-4xl print:mx-auto font-sans text-[12px] leading-normal">
      {/* Header with Logo and Title */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div className="flex items-center gap-3">
          <img
            src="/nillsmart-logo.png"
            alt={BRAND_NAME}
            className="h-14 w-auto object-contain"
          />
          <div>
            <h1 className="font-bold text-xl tracking-tight uppercase text-black">{BRAND_NAME}</h1>
            <p className="text-[11px] text-gray-600">Authentic Skin & Hair Care Destination</p>
            <p className="text-[10px] text-gray-500">Dhaka, Bangladesh · support@nillsmart.com</p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block bg-black text-white text-xs font-bold px-2.5 py-1 uppercase tracking-wider rounded mb-1">
            Customer Receipt
          </span>
          <p className="font-mono text-sm font-bold text-black mt-1">{order.order_number}</p>
          <p className="text-[11px] text-gray-600">
            Date: {new Date(order.created_at).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      {/* Bill To & Shipping Info */}
      <div className="grid grid-cols-2 gap-6 bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Deliver To (Recipient)
          </h2>
          <p className="font-bold text-sm text-black">{order.customer_name}</p>
          <p className="text-gray-800 mt-0.5">{order.address}, {order.city}</p>
          <p className="text-gray-800">Zone: <span className="capitalize">{order.delivery_zone.replace("_", " ")}</span></p>
          <p className="text-gray-800 font-semibold mt-1">Phone: {order.phone}</p>
          {order.email && <p className="text-gray-800">Email: {order.email}</p>}
        </div>

        <div className="text-right">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Payment & Order Status
          </h2>
          <p className="text-gray-800">
            Method: <strong className="uppercase text-black">{order.payment_method}</strong>
          </p>
          <p className="text-gray-800">
            Status: <strong className="capitalize text-black">{order.payment_status}</strong>
          </p>
          {order.payment_reference && (
            <p className="text-gray-800 font-mono text-[11px]">
              Ref: {order.payment_reference}
            </p>
          )}
          <p className="text-gray-800 mt-1">
            Order Status: <strong className="capitalize text-black">{order.status}</strong>
          </p>
        </div>
      </div>

      {/* Ordered Items Table */}
      <div className="mb-6">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
          Ordered Items
        </h2>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100 font-bold text-black">
              <th className="py-2 px-3 w-8">#</th>
              <th className="py-2 px-3">Item Description</th>
              <th className="py-2 px-3 text-center w-16">Qty</th>
              <th className="py-2 px-3 text-right w-24">Price</th>
              <th className="py-2 px-3 text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.items.map((item, index) => (
              <tr key={item.id}>
                <td className="py-2.5 px-3 text-gray-500">{index + 1}</td>
                <td className="py-2.5 px-3 font-semibold text-black">
                  {item.name}
                  {item.size ? <span className="text-gray-600 font-normal text-[11px]"> ({item.size})</span> : ""}
                </td>
                <td className="py-2.5 px-3 text-center">{item.qty}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{taka(item.unit_price)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums font-bold text-black">
                  {taka(item.unit_price * item.qty)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary Box */}
      <div className="flex justify-end mb-8">
        <div className="w-64 bg-gray-50 border border-gray-200 rounded-lg p-3.5 space-y-2 text-xs">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span className="font-semibold tabular-nums text-black">{taka(order.subtotal)}</span>
          </div>

          <div className="flex justify-between text-gray-700">
            <span>Delivery Fee:</span>
            <span className="font-semibold tabular-nums text-black">{taka(order.delivery_fee)}</span>
          </div>

          {order.discount_amount > 0 && (
            <div className="flex justify-between text-green-700 font-semibold">
              <span>Promo Discount:</span>
              <span className="tabular-nums">−{taka(order.discount_amount)}</span>
            </div>
          )}

          <div className="flex justify-between border-t-2 border-black pt-2 text-sm font-bold text-black">
            <span>Grand Total:</span>
            <span className="tabular-nums">{taka(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="border-t border-gray-300 pt-4 text-center text-[10px] text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">Thank you for ordering with {BRAND_NAME}!</p>
        <p>For questions or assistance regarding your order, contact support@nillsmart.com</p>
        <p>This is a computer-generated official customer receipt.</p>
      </div>
    </div>
  );
}
