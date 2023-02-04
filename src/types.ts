export type Listing = {
  uuid?: string;
  listingid?: number;
  name?: string;
  _archived: boolean;
  _draft: boolean;
};

export type urlObject = {
  url: string;
};

export type WebflowJsonToPost = {
  fields: {
    _archived: boolean;
    _draft: boolean;
    heading: string;

    bedrooms: number;
    name: string;
    "listing-number": string;
    thumbnail: urlObject;
    agents: string[];
    bathrooms: number;
    body?: string;
    "car-space"?: number;
    "display-price"?: string;
    "floor-plans": urlObject[];
    gallery: urlObject[];
    "harcourts-net-url"?: string;
    "listing-id"?: string;
    "listing-type-name"?: string;
    lounges?: number;
    "property-attributes"?: string;
    "property-type"?: string;
    state?: string;
    "street-address"?: string;
    suburb?: string;
    "video-link"?: string;
  };
};

export type WebflowAgentsResponse = {
  items: [
    {
      _archived: boolean;
      _draft: boolean;
      "email-address": string;
      "display-name": string;
      "last-name": string;
      "job-title": string;
      "first-name": string;
      name: string;
      "mission-statement": string;
      slug: string;
      "agent-photo": {
        fileId: string;
        url: string;
        alt: string | null;
      };
      "updated-on": string;
      "updated-by": string;
      "created-on": string;
      "created-by": string;
      "published-on": string | null;
      "published-by": string | null;
      _cid: string;
      _id: string;
    }
  ];
  count: number;
  limit: number;
  offset: number;
  total: number;
};

export interface ListingDetail {
  ListingID?: string[] | null;
  Status?: string[] | null;
  Bathrooms?: string[] | null;
  Bedrooms?: string[] | null;
  Lounges?: string[] | null;
  Toilets?: string[] | null;
  CarSpacesGarage?: string[] | null;
  CreateDateTime?: string[] | null;
  DisplayPrice?: string[] | null;
  Images?: ImagesEntity[] | null;
  InternetBody?: string[] | null;
  InternetHeading?: string[] | null;
  Latitude?: string[] | null;
  ListingNumber?: string[] | null;
  ListingTypeID?: string[] | null;
  ListingTypeName?: string[] | null;
  LocationID?: string[] | null;
  Longitude?: string[] | null;
  MapZoomLevel?: string[] | null;
  OrganisationalUnitID?: string[] | null;
  OrganisationalUnitName?: string[] | null;
  PropertyTypes?: PropertyTypesEntity[] | null;
  ListingStaff?: ListingStaffEntity[] | null;
  StreetAddress?: string[] | null;
  Suburb?: string[] | null;
  Region?: string[] | null;
  State?: string[] | null;
  PostCode?: string[] | null;
  VideoTourUrl?: string[] | null;
  AttributeData?: AttributeDataEntity[] | null;
}
export interface ImagesEntity {
  Image?: ImageEntity[] | null;
}
export interface ImageEntity {
  ImageID?: string[] | null;
  Description?: string[] | null;
  IsFloorPlan?: string[] | null;
  LargePhotoHeight?: string[] | null;
  LargePhotoUrl?: string[] | null;
  LargePhotoWidth?: string[] | null;
  ListingID?: string[] | null;
  ThumbnailPhotoHeight?: string[] | null;
  ThumbnailPhotoUrl?: string[] | null;
  ThumbnailPhotoWidth?: string[] | null;
  CustomPhotoHeight?: string[] | null;
  CustomPhotoUrl?: string[] | null;
  CustomPhotoWidth?: string[] | null;
}
export interface PropertyTypesEntity {
  PropertyType?: PropertyTypeEntity[] | null;
}
export interface PropertyTypeEntity {
  PropertyTypeID?: string[] | null;
  PropertyTypeName?: string[] | null;
}
export interface ListingStaffEntity {
  Staff?: StaffEntity[] | null;
}
export interface StaffEntity {
  StaffID?: string[] | null;
  DisplayName?: string[] | null;
  EmailAddress?: string[] | null;
  MobileNumber?: string[] | null;
  HomeNumber?: string[] | null;
  OrganisationalUnitID?: string[] | null;
  StaffPhotoUrl?: string[] | null;
  StaffLargePhotoUrl?: string[] | null;
  OfficeName?: string[] | null;
  OfficeAddress?: string[] | null;
}
export interface AttributeDataEntity {
  Features?: FeaturesEntity[] | null;
}
export interface FeaturesEntity {
  Feature?: FeatureEntity[] | null;
}
export interface FeatureEntity {
  Name?: string[] | null;
  Value?: string[] | null;
}
