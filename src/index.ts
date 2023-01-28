import { parseStringPromise } from "xml2js";

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  WEBFLOW_API_KEY: string;
}

async function getListings() {
  const url = "https://nz.harcourts.biz/Listing/Rss";
  const response = await fetch(url, {
    method: "GET",
  });
  const data = await response.text();
  return data;
}

type Listing = {
  uuid?: string;
  listingid?: number;
  name?: string;
  _archived: boolean;
  _draft: boolean;
};

function processJson(json: any): Listing[] {
  let newListings: Listing[] = [];

  let entries = json.entry;
  for (let entry of entries) {
    const regex = /uuid:(\w+-\w+-\w+-\w+-\w+);id=(\d+)/;
    const [, uuid, listingid] = entry.id[0].match(regex);
    const name = entry.title[0]["_"];

    let newListing: Listing = {
      uuid,
      listingid,
      name,
      _archived: false,
      _draft: false,
    };
    newListings.push(newListing);
  }
  return newListings;
}

// async function addItemToWebflow(itemJson: any) {
//   const url =
//     "https://api.webflow.com/collections/63d46d20fb349f0ee632f934/items";
//   const options = {
//     method: "POST",
//     headers: {
//       accept: "application/json",
//       "content-type": "application/json",
//       authorization: `Bearer ${}`,
//     },
//     body: JSON.stringify({
//       fields: itemJson,
//     }),
//   };

//   try {
//     const response = await fetch(url, options);
//     const json = await response.json();
//     return json;
//   } catch (error) {
//     console.log("error: ", error);
//   }
// }

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const XMLdata = await getListings();
    //console.log({ XMLdata });
    const json = await parseStringPromise(XMLdata);
    let newListings = processJson(json.feed);
    console.log(newListings[0]);
    // const webflowJsonResponse = await addItemToWebflow(newListings[0]);

    const url =
      "https://api.webflow.com/collections/63d46d20fb349f0ee632f934/items";
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${env.WEBFLOW_API_KEY}`,
      },
      body: JSON.stringify({
        fields: newListings[0],
      }),
    };
    const webflowResponse = await fetch(url, options);
    const result: any = await webflowResponse.json();
    return new Response(JSON.stringify(result));
  },
};
