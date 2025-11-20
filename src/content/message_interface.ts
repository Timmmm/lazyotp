interface RequestFillOtp {
    type: "FILL_OTP";
    code: string;
}

interface RequestGetImageUrls {
    type: "GET_IMAGE_URLS";
}

export type Request = RequestFillOtp | RequestGetImageUrls;

export interface ResponseGetImageUrls {
    image_srcs: string[];
}
