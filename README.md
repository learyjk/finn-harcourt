# Harcourts API to Webflow

## Issues

1. FB22396 no bedrooms info -> Land plot? Pass 0 by default?
2. agents must be added by id -> look up agent in agents CMS first. Can only lookup by webflow ID. Have to filter. What is the liklihood of agents being in the harcourts API but not in Webflow CMS? (2 sources of truth). Should we just add agents to Webflow if they don't exist in the Webflow CMS? ~2 hours.
3. What is the formula for backup url? listingNumber-address-year? I don't see a field for this in the API response.
4. N post code given for fb25977
