import { parseStringPromise } from "xml2js";
import { load } from "cheerio";
import { get } from "https";
import { delay, imageIsLessThanSize } from "./utils";

import {
  ListingDetail,
  Listing,
  WebflowJsonToPost,
  WebflowAgentsResponse,
  urlObject,
} from "./types";

const STARTS_WITH = "FP";
const START_PAGE = 73;
const WEBFLOW_LIMIT = 100;
const FOUR_MB = 4 * 1000 * 1000;

export interface Env {
  WEBFLOW_API_KEY: string;
  WEBFLOW_LISTINGS_COLLECTION_ID: string;
  WEBFLOW_AGENTS_COLLECTION_ID: string;
}

function formatBodyTextToHTML(text: string) {
  if (text === "") return "";
  const $ = load("<body></body>");

  const lines = text.split("\n");
  let listStart = false;
  lines.forEach((line) => {
    if (line.startsWith("-")) {
      if (!listStart) {
        $("body").append("<ul></ul>");
        listStart = true;
      }
      $("ul").append(`<li>${line.substr(1)}</li>`);
    } else {
      $("body").append(`<p>${line}</p>`);
    }
  });

  const html = $("body").html();
  return html;
}

async function getListingNumbersFromWebflow(
  env: Env,
  itemNumbers: string[] = [],
  offset: number = 0
): Promise<any> {
  const url = `https://api.webflow.com/collections/${env.WEBFLOW_LISTINGS_COLLECTION_ID}/items?offset=${offset}`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${env.WEBFLOW_API_KEY}`,
    },
  };

  try {
    const response = await fetch(url, options);
    const json: any = await response.json();
    let numbers = json.items.map((item: any) => {
      return item["listing-number"];
    });
    itemNumbers = [...itemNumbers, ...numbers];

    if (json.count === WEBFLOW_LIMIT) {
      return getListingNumbersFromWebflow(
        env,
        itemNumbers,
        json.offset + WEBFLOW_LIMIT
      );
    }
    return itemNumbers;
  } catch (error) {
    console.log("error: ", error);
  }
}

async function getRssListings(pageIndex: number = 0) {
  const url = `http://www.harcourts.co.nz/Listing/Rss?searchresultsperpage=thirty&pageIndex=${pageIndex}`;
  const response = await fetch(url, {
    method: "GET",
  });
  const data = await response.text();
  return data;
}

async function getAllRssListingsByOuid(
  pageIndex: number = 0,
  ouid: number = 860,
  listingNumbers: string[] = []
): Promise<string[]> {
  const url = `http://www.harcourts.co.nz/Listing/Rss?ouid=${ouid}&searchresultsperpage=thirty&pageIndex=${pageIndex}`;

  const response = await fetch(url, {
    method: "GET",
  });

  const XMLdata = await response.text();
  const json = await parseStringPromise(XMLdata);

  const listingNumbersFromThisPage = processRssJsonForListingNumbers(json.feed);
  listingNumbers = [...listingNumbers, ...listingNumbersFromThisPage];

  let totalCount = parseInt(json.feed.listings[0]["$"]["totalcount"], 10);
  let pages = Math.floor(totalCount / 30);
  if (pageIndex < pages) {
    return getAllRssListingsByOuid(pageIndex + 1, ouid, listingNumbers);
  }
  return listingNumbers;
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

function processRssJsonForListingNumbers(json: any) {
  let listingNumbers: string[] = [];

  let entries = json.entry;
  for (let entry of entries) {
    const listingNumber = entry.listing[0]["$"]["listingNumber"];
    if (listingNumber.startsWith("FB") || listingNumber.startsWith("FPM")) {
      listingNumbers.push(listingNumber);
    }
  }
  return listingNumbers;
}

async function processJsonForWebflow(
  listingDetail: ListingDetail,
  env: Env
): Promise<WebflowJsonToPost> {
  const agentNames = listingDetail.ListingStaff![0].Staff!.map((staff) => {
    return staff.DisplayName![0];
  });
  const agentIds = await findAgentIdsFromNames(agentNames, env);

  const gallery: urlObject[] =
    listingDetail
      .Images![0].Image?.filter((imageObj) => {
        return imageObj.IsFloorPlan![0] !== "True";
      })
      .map((imageObj) => {
        return { url: imageObj.LargePhotoUrl![0] };
      }) || [];

  const floorPlans: urlObject[] =
    listingDetail
      .Images![0].Image?.filter((imageObj) => {
        return imageObj.IsFloorPlan![0] !== "False";
      })
      .map((imageObj) => {
        return { url: imageObj.LargePhotoUrl![0] };
      }) || [];

  // gallery.filter((image) => {
  //   return imageIsLessThanSize(image.url, FOUR_MB);
  // });

  // floorPlans.filter((image) => {
  //   return imageIsLessThanSize(image.url, FOUR_MB);
  // });

  const propertyAttributes =
    listingDetail.AttributeData![0].Features![0].Feature?.map((feat) => {
      return `${feat.Name}: ${feat.Value}`;
    });

  const body = formatBodyTextToHTML(listingDetail.InternetBody![0]);

  const url = getUrlForListing(listingDetail);

  return {
    fields: {
      heading: listingDetail.InternetHeading![0],
      name:
        listingDetail.StreetAddress![0] !== ""
          ? listingDetail.StreetAddress![0]
          : listingDetail.InternetHeading![0],
      "listing-number": listingDetail.ListingNumber![0],
      bedrooms: listingDetail.Bedrooms
        ? parseInt(listingDetail.Bedrooms[0], 10)
        : 0,
      bathrooms: listingDetail.Bathrooms
        ? parseInt(listingDetail.Bathrooms[0], 10)
        : 0,
      lounges: listingDetail.Lounges
        ? parseInt(listingDetail.Lounges![0], 10)
        : 0,
      thumbnail: {
        url: listingDetail.Images![0].Image![0].ThumbnailPhotoUrl![0],
      },
      gallery,
      "floor-plans": floorPlans,
      agents: agentIds || [],
      "car-space": listingDetail.CarSpacesGarage
        ? parseInt(listingDetail.CarSpacesGarage[0], 10)
        : 0,
      "display-price": listingDetail.DisplayPrice![0],
      "property-type":
        listingDetail.PropertyTypes![0].PropertyType![0].PropertyTypeName![0],
      "listing-type-name": listingDetail.ListingTypeName![0],
      "street-address": listingDetail.StreetAddress![0],
      suburb: listingDetail.Suburb![0].replaceAll("-", " "),
      state: listingDetail.State![0],
      "listing-id": listingDetail.ListingID![0],
      "video-link": listingDetail.VideoTourUrl
        ? listingDetail.VideoTourUrl![0]
        : "",
      body: body || "",
      "property-attributes": propertyAttributes?.join("\n") || "",
      "harcourts-net-url": url,
      _archived: false,
      _draft: false,
    },
  };
}

function getUrlForListing(listingDetail: ListingDetail) {
  const base = "https://harcourts.net/nz/office/flat-bush/listing/";
  const listingNumber = listingDetail.ListingNumber![0].toLowerCase();

  return `${base}${listingNumber}`;
}

async function findAgentIdsFromNames(
  agentNames: string[],
  env: Env
): Promise<string[] | undefined> {
  const url = `https://api.webflow.com/collections/${env.WEBFLOW_AGENTS_COLLECTION_ID}/items`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${env.WEBFLOW_API_KEY}`,
    },
  };
  const resp = await fetch(url, options);
  const data: WebflowAgentsResponse = await resp.json();

  const matchingAgentsIds = data.items
    .filter((agentItem) => {
      return agentNames.includes(agentItem.name);
    })
    .map((matchingAgent) => {
      return matchingAgent._id;
    });

  return matchingAgentsIds;
}

async function postListingDetailToWebflow(
  jsonToPost: WebflowJsonToPost,
  env: Env
) {
  const url = `https://api.webflow.com/collections/${env.WEBFLOW_LISTINGS_COLLECTION_ID}/items`;
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
        console.log(allListingNumbers);
        //await delay(1);
      }
      return new Response(JSON.stringify(allListingNumbers));
    } else if (url.pathname === "/addListingToWebflowByListingNumber") {
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
      const jsonPreppedForWebflow = await processJsonForWebflow(
        json.Listing,
        env
      );
      const webflowResponseData = await postListingDetailToWebflow(
        jsonPreppedForWebflow,
        env
      );
      return new Response(JSON.stringify(jsonPreppedForWebflow));
    } else if (url.pathname === "/getAllListingsInWebflow") {
      const listingNumbers: string[] = await getListingNumbersFromWebflow(env);
      return new Response(JSON.stringify(listingNumbers));
    } else if (url.pathname === "/getAllListingsFromRssByOuid") {
      const listingsForPage = await getAllRssListingsByOuid(0, 863);
      return new Response(JSON.stringify(listingsForPage));
    } else if (url.pathname === "/addNextListingToWebflow") {
      console.log("addNextListingToWebflow");
      const listingNumbersInWebflow = await getListingNumbersFromWebflow(env);
      const listingNumbersFromAPI860 = await getAllRssListingsByOuid(0, 860);
      const listingNumbersFromAPI863 = await getAllRssListingsByOuid(0, 863);

      const listingNumbersFromAPI = [
        ...listingNumbersFromAPI860,
        ...listingNumbersFromAPI863,
      ];
      // console.log("lisitng Numbers in Webflow: ", listingNumbersInWebflow);
      // console.log("from API: ", listingNumbersFromAPI);

      const listingsNotInWebflow = listingNumbersFromAPI.filter((listing) => {
        return !listingNumbersInWebflow.includes(listing);
      });

      console.log("listings not in Webflow yet: ", listingsNotInWebflow);

      if (listingsNotInWebflow.length === 0) {
        return new Response("No new listings found to add to Webflow");
      }

      console.log(`adding listingNumber ${listingsNotInWebflow[0]} to webflow`);

      const XMLdata = await getListingDetailXML(listingsNotInWebflow[0]);
      if (!XMLdata || XMLdata.indexOf("<!DOCTYPE html>") !== -1) {
        return new Response("Error with this listingNumber");
      }
      const json = await parseStringPromise(XMLdata);
      const jsonPreppedForWebflow = await processJsonForWebflow(
        json.Listing,
        env
      );
      const webflowResponseData = await postListingDetailToWebflow(
        jsonPreppedForWebflow,
        env
      );
      return new Response(JSON.stringify(webflowResponseData));
    } else if (url.pathname === "/getWebflowJsonByListingNumber") {
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
      const jsonPreppedForWebflow = await processJsonForWebflow(
        json.Listing,
        env
      );
      return new Response(JSON.stringify(jsonPreppedForWebflow));
    } else if (url.pathname === "/testImageSize") {
      let imageUrl = url.searchParams.get("imageUrl");
      if (!imageUrl) {
        return new Response("Please provide an imageUrl in query params");
      }
      let result = await imageIsLessThanSize(imageUrl, FOUR_MB);
      return new Response(JSON.stringify(result));
    } else {
      return new Response("nothing to return");
    }
  },

  async scheduled(event, env, ctx) {
    console.log("running cron to add an item to webflow");
    // Write code for updating your API
    // Every minute
    const listingNumbersInWebflow = await getListingNumbersFromWebflow(env);
    const listingNumbersFromAPI860 = await getAllRssListingsByOuid(0, 860);
    const listingNumbersFromAPI863 = await getAllRssListingsByOuid(0, 863);

    const listingNumbersFromAPI = [
      ...listingNumbersFromAPI860,
      ...listingNumbersFromAPI863,
    ];
    // console.log("lisitng Numbers in Webflow: ", listingNumbersInWebflow);
    // console.log("from API: ", listingNumbersFromAPI);

    const listingsNotInWebflow = listingNumbersFromAPI.filter((listing) => {
      return !listingNumbersInWebflow.includes(listing);
    });

    console.log("listings not in Webflow yet: ", listingsNotInWebflow);

    if (listingsNotInWebflow.length === 0) {
      return new Response("No new listings found to add to Webflow");
    }

    console.log(`adding listingNumber ${listingsNotInWebflow[0]} to webflow`);

    const XMLdata = await getListingDetailXML(listingsNotInWebflow[0]);
    if (!XMLdata || XMLdata.indexOf("<!DOCTYPE html>") !== -1) {
      return new Response("Error with this listingNumber");
    }
    const json = await parseStringPromise(XMLdata);
    const jsonPreppedForWebflow = await processJsonForWebflow(
      json.Listing,
      env
    );
    const webflowResponseData = await postListingDetailToWebflow(
      jsonPreppedForWebflow,
      env
    );
    console.log("cron processed");
    return new Response(JSON.stringify(webflowResponseData));
  },
};
