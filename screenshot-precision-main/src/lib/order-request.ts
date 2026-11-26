import { z } from "zod";

export const ORDER_REQUEST_PATH = "/api/order-requests";

const optionalAddress = z.string().trim().max(240);

export const orderFields = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z
      .string()
      .trim()
      .max(30)
      .regex(/^\+?[0-9 ()-]+$/)
      .refine((value) => {
        const digits = value.replace(/\D/g, "").length;
        return digits >= 7 && digits <= 15;
      }),
    fulfillment: z.enum(["delivery", "pickup"]),
    address: optionalAddress,
    measure: z.boolean(),
  })
  .superRefine(({ fulfillment, address }, context) => {
    if (fulfillment === "delivery" && address.length < 4) {
      context.addIssue({
        code: "custom",
        path: ["address"],
        message: "address",
      });
    }
  });

export const orderRequestSchema = z.strictObject({
  id: z.uuid(),
  locale: z.enum(["ru", "tk", "en"]),
  contact: orderFields,
  items: z
    .array(
      z.strictObject({
        id: z.string().min(1).max(60),
        qty: z.number().int().min(1).max(99),
        color: z.string().min(1).max(80).optional(),
        size: z.string().min(1).max(30).optional(),
      }),
    )
    .min(1)
    .max(60),
});
