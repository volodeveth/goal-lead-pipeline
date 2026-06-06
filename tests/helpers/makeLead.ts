import type { NormalizedLead } from "@/lib/schemas/lead";
import { v4 as uuid } from "uuid";

export function makeNormalizedLead(over: Partial<NormalizedLead> = {}): NormalizedLead {
  return {
    requestId: uuid(),
    name: "Олена Іваненко",
    email: "olena@gmail.com",
    phone: "+380971234567",
    company: null,
    serviceInterest: ["seo"],
    budgetRange: "5k-15k",
    message: "Хочу SEO для нового сайту.",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    ...over,
  };
}
