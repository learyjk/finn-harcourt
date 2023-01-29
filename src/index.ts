import { parseStringPromise } from "xml2js";
import { delay } from "./utils";
import { ListingDetail, Listing, WebflowJsonToPost } from "./types";

const STARTS_WITH = "FB";
const START_PAGE = 0;

export interface Env {
  WEBFLOW_API_KEY: string;
  WEBFLOW_COLLECTION_ID: string;
}

async function getRssListings(pageIndex: number = 0) {
  const url = `https://nz.harcourts.biz/Listing/Rss?pageindex=${pageIndex}&searchresultsperpage=thirty`;
  const response = await fetch(url, {
    method: "GET",
  });
  const data = await response.text();
  return data;
}

async function getListingDetailXML(listingNumber: string) {
  try {
    const url = `http://www.harcourts.co.nz/Listing/XML/${listingNumber}`;
    const response = await fetch(url, {
      method: "GET",
    });
    const data = await response.text();
    return data;
  } catch (error) {
    console.log(error);
  }
}

function processJsonForFullListing(json: any): Listing[] {
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

function processRssJsonForListingNumbers(json: any) {
  let listingNumbers: string[] = [];

  let entries = json.entry;
  for (let entry of entries) {
    const listingNumber = entry.listing[0]["$"]["listingNumber"];
    if (listingNumber.startsWith(STARTS_WITH)) {
      listingNumbers.push(listingNumber);
    }
  }
  return listingNumbers;
}

function processJsonForWebflow(
  listingDetail: ListingDetail
): WebflowJsonToPost {
  return {
    fields: {
      "listing-number": listingDetail.ListingNumber![0],
      bedrooms: listingDetail.Bedrooms![0],
      image: { url: listingDetail.Images![0].Image![0].LargePhotoUrl![0] },
      _archived: false,
      _draft: false,
      name: "name here",
    },
  };
}

async function postListingDetailToWebflow(
  jsonToPost: WebflowJsonToPost,
  env: Env
) {
  const url = `https://api.webflow.com/collections/${env.WEBFLOW_COLLECTION_ID}/items`;
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${env.WEBFLOW_API_KEY}`,
    },
    body: JSON.stringify(jsonToPost),
  };
  const resp = await fetch(url, options);
  const data = await resp.json();
  return data;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/getFortyNinePagesOfListingNumbers") {
      let allListingNumbers: string[] = [];
      for (let i = START_PAGE; i <= START_PAGE + 49; i++) {
        console.log("getting pageindex: ", i);
        const XMLdata = await getRssListings(i);
        const json = await parseStringPromise(XMLdata);
        const listingNumbers = processRssJsonForListingNumbers(json.feed);
        allListingNumbers = [...allListingNumbers, ...listingNumbers];
        //await delay(1);
      }
      return new Response(JSON.stringify(allListingNumbers));
    } else if (url.pathname === "/getListingDetail") {
      let listingNumber = url.searchParams.get("listingNumber");
      if (!listingNumber) {
        return new Response(
          "Please specify a listingNumber as a url query parameter"
        );
      }
      const XMLdata = await getListingDetailXML(listingNumber);
      if (!XMLdata || XMLdata.indexOf("<!DOCTYPE html>") !== -1) {
        return new Response("Error with this listingNumber");
      }
      const json = await parseStringPromise(XMLdata);
      const jsonPreppedForWebflow = processJsonForWebflow(json.Listing);
      const webflowResponseData = await postListingDetailToWebflow(
        jsonPreppedForWebflow,
        env
      );
      return new Response(JSON.stringify(webflowResponseData));
    } else {
      return new Response("nothing to return");
    }
    //   const XMLdata = await getListings();
    //   //console.log({ XMLdata });
    //   const json = await parseStringPromise(XMLdata);
    //   let newListings = processJson(json.feed);
    //   // const webflowJsonResponse = await addItemToWebflow(newListings[0]);
    //   return new Response(JSON.stringify(json.feed));

    //   const jsons = await Promise.all(
    //     newListings.map(async (listing) => {
    //       const url =
    //         "https://api.webflow.com/collections/63d46d20fb349f0ee632f934/items";
    //       const options = {
    //         method: "POST",
    //         headers: {
    //           accept: "application/json",
    //           "content-type": "application/json",
    //           authorization: `Bearer ${env.WEBFLOW_API_KEY}`,
    //         },
    //         body: JSON.stringify({
    //           fields: listing,
    //         }),
    //       };
    //       const resp = await fetch(url, options);
    //       const data = await resp.json();
    //     })
    //   );

    //   return new Response(JSON.stringify(jsons));
    // }
  },
};
