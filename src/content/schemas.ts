import { z } from 'zod';
export const schemas = {
  pages: {
    home: z.object({
      "hero": z.object({
        "headline": z.string(),
        "subheadline": z.string(),
        "searchPlaceholder": z.string(),
        "searchCta": z.string(),
        "mockup": z.object({
          "streetName": z.string(),
          "booked": z.number(),
          "goal": z.number(),
          "discount": z.string(),
          "label": z.string()
        })
      }),
      "trustSignals": z.array(z.object({
        "id": z.string(),
        "icon": z.string(),
        "label": z.string(),
        "detail": z.string()
      })),
      "services": z.object({
        "tabs": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "soloRate": z.number(),
          "batchRate": z.number(),
          "savings": z.number(),
          "contractors": z.array(z.object({
            "id": z.string(),
            "name": z.string(),
            "rating": z.number(),
            "jobs": z.number(),
            "proximity": z.string(),
            "blockCaptain": z.boolean(),
            "specialty": z.string()
          }))
        }))
      }),
      "howItWorks": z.object({
        "steps": z.array(z.object({
          "id": z.string(),
          "number": z.string(),
          "title": z.string(),
          "description": z.string()
        }))
      }),
      "stats": z.array(z.object({
        "id": z.string(),
        "value": z.string(),
        "label": z.string(),
        "detail": z.string()
      })),
      "cta": z.object({
        "headline": z.string(),
        "subheadline": z.string(),
        "searchPlaceholder": z.string(),
        "searchCta": z.string(),
        "contractorLink": z.string()
      })
    }),
    book: z.object({
      "TIME_SLOTS": z.array(z.string())
    }),
    track: z.object({
      "MOCK_UPDATES": z.array(z.object({
        "time": z.string(),
        "label": z.string(),
        "done": z.boolean(),
        "id": z.string()
      })),
      "homes": z.array(z.object({
        "x": z.number(),
        "y": z.number(),
        "label": z.string(),
        "active": z.boolean(),
        "booked": z.boolean(),
        "id": z.string()
      })),
      "reasons": z.array(z.string())
    }),
    join: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "hero": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "subheadline": z.string()
      }),
      "steps": z.array(z.object({
        "id": z.string(),
        "label": z.string()
      })),
      "services": z.array(z.object({
        "id": z.string(),
        "label": z.string(),
        "icon": z.string(),
        "description": z.string()
      })),
      "activation": z.object({
        "depositOption": z.object({
          "title": z.string(),
          "amount": z.number(),
          "badge": z.string(),
          "bullets": z.array(z.string())
        }),
        "referralOption": z.object({
          "title": z.string(),
          "badge": z.string(),
          "bullets": z.array(z.string())
        })
      }),
      "blockCaptain": z.object({
        "badge": z.string(),
        "headline": z.string(),
        "description": z.string(),
        "perks": z.array(z.string())
      }),
      "waitlist": z.object({
        "headline": z.string(),
        "description": z.string(),
        "ctaLabel": z.string()
      })
    }),
    field: z.object({
      "ADDON_CATALOG": z.array(z.object({
        "label": z.string(),
        "price": z.number(),
        "id": z.string()
      }))
    }),
    admin: z.object({
      "pageTitle": z.string(),
      "pageSubtitle": z.string(),
      "liveLabel": z.string(),
      "dateLabel": z.string(),
      "tabs": z.array(z.object({
        "id": z.string(),
        "label": z.string()
      })),
      "demoBanner": z.string(),
      "ratingLegend": z.array(z.object({
        "title": z.string(),
        "description": z.string(),
        "id": z.string()
      }))
    }),
    cart: z.object({
      "pageTitle": z.string(),
      "backLink": z.string(),
      "demoBanner": z.string(),
      "emptyTitle": z.string(),
      "emptySubtitle": z.string(),
      "emptyCtaLabel": z.string(),
      "orderSummaryTitle": z.string(),
      "subtotalLabel": z.string(),
      "platformFeeLabel": z.string(),
      "totalLabel": z.string(),
      "checkoutCtaLabel": z.string(),
      "processingLabel": z.string(),
      "clearCartLabel": z.string(),
      "trustItems": z.array(z.object({
        "icon": z.string(),
        "label": z.string(),
        "detail": z.string(),
        "id": z.string()
      }))
    }),
    checkout_success: z.object({
      "verifyingTitle": z.string(),
      "verifyingSubtitle": z.string(),
      "failedTitle": z.string(),
      "failedTryAgainLabel": z.string(),
      "failedReturnHomeLabel": z.string(),
      "successTitle": z.string(),
      "successSubtitle": z.string(),
      "detailCustomerLabel": z.string(),
      "detailAmountLabel": z.string(),
      "detailStatusLabel": z.string(),
      "detailStatusValue": z.string(),
      "trackCtaLabel": z.string(),
      "returnHomeLabel": z.string(),
      "refLabel": z.string()
    })
  }
};
export type Schemas = typeof schemas;