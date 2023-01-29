export type Listing = {
  uuid?: string;
  listingid?: number;
  name?: string;
  _archived: boolean;
  _draft: boolean;
};

export type WebflowJsonToPost = {
  fields: {
    _archived: boolean;
    _draft: boolean;
    "listing-number": string;
    bedrooms: string;
    name: string;
    image: {
      url: string;
    };
  };
};

export interface ListingDetail {
  ListingID?: string[] | null;
  Status?: string[] | null;
  Bathrooms?: string[] | null;
  Bedrooms?: string[] | null;
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
